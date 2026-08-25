<?php

declare(strict_types=1);

namespace GarzonTurnos\Api\Http;

use GarzonTurnos\Api\Auth\AuthService;
use GarzonTurnos\Api\Auth\SessionService;
use DateTimeImmutable;
use DateTimeZone;
use PDO;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;
use Slim\Factory\AppFactory as SlimAppFactory;
use Slim\Interfaces\RouteCollectorProxyInterface;

final class AppFactory
{
    /**
     * @param array{sessionTtl?: int, secureCookie?: bool, cookieName?: string, auditPepper?: string} $settings
     * @return \Slim\App<\Psr\Container\ContainerInterface|null>
     */
    public static function create(PDO $database, array $settings = []): \Slim\App
    {
        $sessionTtl = $settings['sessionTtl'] ?? 28_800;
        $secureCookie = $settings['secureCookie'] ?? true;
        $cookieName = $settings['cookieName'] ?? 'GTSESSID';
        $auditPepper = $settings['auditPepper'] ?? '';
        $sessions = new SessionService($database, $sessionTtl, $auditPepper);
        $auth = new AuthService($database);

        $app = SlimAppFactory::create();
        $app->addBodyParsingMiddleware();
        $app->addRoutingMiddleware();

        $app->group('/api/v1', function (RouteCollectorProxyInterface $api) use (
            $sessions,
            $auth,
            $sessionTtl,
            $secureCookie,
            $cookieName,
        ): void {
            $api->get('/health', function (
                ServerRequestInterface $request,
                ResponseInterface $response,
            ): ResponseInterface {
                return JsonResponse::success($response, [
                    'status' => 'ok',
                    'timestamp' => (new DateTimeImmutable('now', new DateTimeZone('UTC')))->format(DATE_ATOM),
                ]);
            });

            $api->get('/auth/csrf', function (
                ServerRequestInterface $request,
                ResponseInterface $response,
            ) use ($sessions, $sessionTtl, $secureCookie, $cookieName): ResponseInterface {
                $existingToken = (string) ($request->getCookieParams()[$cookieName] ?? '');
                $sessions->revoke($existingToken);
                $session = $sessions->createAnonymous(
                    $request->getHeaderLine('User-Agent'),
                    self::clientIp($request),
                );

                return JsonResponse::success($response, ['csrfToken' => $session['csrfToken']])
                    ->withHeader(
                        'Set-Cookie',
                        SessionCookie::create($cookieName, $session['sessionToken'], $sessionTtl, $secureCookie),
                    );
            });

            $api->post('/auth/login', function (
                ServerRequestInterface $request,
                ResponseInterface $response,
            ) use ($sessions, $auth, $sessionTtl, $secureCookie, $cookieName): ResponseInterface {
                $sessionToken = (string) ($request->getCookieParams()[$cookieName] ?? '');
                $csrfToken = $request->getHeaderLine('X-CSRF-Token');
                if (!$sessions->validateCsrf($sessionToken, $csrfToken)) {
                    return JsonResponse::error($response, 'CSRF_INVALID', 'Solicitud no autorizada.', 403);
                }

                $body = $request->getParsedBody();
                $body = is_array($body) ? $body : [];
                $unknownFields = array_diff(array_keys($body), ['identifier', 'pin']);
                $identifier = is_string($body['identifier'] ?? null) ? trim($body['identifier']) : '';
                $pin = is_string($body['pin'] ?? null) ? trim($body['pin']) : '';
                if ($unknownFields !== [] || strlen($identifier) < 2 || strlen($identifier) > 254
                    || preg_match('/^\d{4,12}$/D', $pin) !== 1) {
                    return JsonResponse::error(
                        $response,
                        'VALIDATION_FAILED',
                        'Los datos de acceso no son válidos.',
                        422,
                    );
                }

                $user = $auth->authenticate($identifier, $pin);
                if ($user === null) {
                    return JsonResponse::error(
                        $response,
                        'AUTH_INVALID_CREDENTIALS',
                        'Identificador o PIN incorrectos.',
                        401,
                    );
                }

                $authenticated = $sessions->authenticateSession(
                    $sessionToken,
                    $user['id'],
                    $request->getHeaderLine('User-Agent'),
                    self::clientIp($request),
                );

                return JsonResponse::success($response, $user)
                    ->withHeader(
                        'Set-Cookie',
                        SessionCookie::create(
                            $cookieName,
                            $authenticated['sessionToken'],
                            $sessionTtl,
                            $secureCookie,
                        ),
                    )
                    ->withHeader('X-CSRF-Token', $authenticated['csrfToken']);
            });

            $api->get('/auth/session', function (
                ServerRequestInterface $request,
                ResponseInterface $response,
            ) use ($sessions, $auth, $cookieName): ResponseInterface {
                $sessionToken = (string) ($request->getCookieParams()[$cookieName] ?? '');
                $session = $sessions->findValid($sessionToken);
                $user = is_string($session['user_id'] ?? null)
                    ? $auth->findSessionUserById($session['user_id'])
                    : null;
                if ($user === null) {
                    return JsonResponse::error($response, 'AUTH_REQUIRED', 'Debes iniciar sesión.', 401);
                }

                return JsonResponse::success($response, $user);
            });

            $api->post('/auth/logout', function (
                ServerRequestInterface $request,
                ResponseInterface $response,
            ) use ($sessions, $secureCookie, $cookieName): ResponseInterface {
                $sessionToken = (string) ($request->getCookieParams()[$cookieName] ?? '');
                $session = $sessions->findValid($sessionToken);
                if (!is_string($session['user_id'] ?? null)) {
                    return JsonResponse::error($response, 'AUTH_REQUIRED', 'Debes iniciar sesión.', 401);
                }
                if (!$sessions->validateCsrf($sessionToken, $request->getHeaderLine('X-CSRF-Token'))) {
                    return JsonResponse::error($response, 'CSRF_INVALID', 'Solicitud no autorizada.', 403);
                }

                $sessions->revoke($sessionToken);

                return JsonResponse::success($response, ['authenticated' => false])
                    ->withHeader('Set-Cookie', SessionCookie::clear($cookieName, $secureCookie));
            });
        });

        $errorMiddleware = $app->addErrorMiddleware(false, true, true);
        $errorMiddleware->setDefaultErrorHandler(
            static function (
                ServerRequestInterface $request,
                \Throwable $exception,
                bool $displayErrorDetails,
                bool $logErrors,
                bool $logErrorDetails,
            ) use ($app): ResponseInterface {
                return JsonResponse::error(
                    $app->getResponseFactory()->createResponse(),
                    'INTERNAL_ERROR',
                    'Ocurrió un error interno.',
                    500,
                );
            },
        );

        $app->add(static function (
            ServerRequestInterface $request,
            RequestHandlerInterface $handler,
        ): ResponseInterface {
            return $handler->handle($request)
                ->withHeader('X-Content-Type-Options', 'nosniff')
                ->withHeader('X-Frame-Options', 'DENY')
                ->withHeader('Referrer-Policy', 'no-referrer')
                ->withHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()')
                ->withHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
        });

        return $app;
    }

    private static function clientIp(ServerRequestInterface $request): string
    {
        $serverParams = $request->getServerParams();
        return is_string($serverParams['REMOTE_ADDR'] ?? null) ? $serverParams['REMOTE_ADDR'] : '';
    }
}
