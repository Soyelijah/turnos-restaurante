<?php

declare(strict_types=1);

namespace GarzonTurnos\Api\Http;

use Psr\Http\Message\ResponseInterface;

final class JsonResponse
{
    public static function success(ResponseInterface $response, mixed $data, int $status = 200): ResponseInterface
    {
        $response->getBody()->write(json_encode(
            ['success' => true, 'data' => $data],
            JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES,
        ));

        return $response
            ->withStatus($status)
            ->withHeader('Content-Type', 'application/json; charset=utf-8')
            ->withHeader('Cache-Control', 'no-store');
    }

    /** @param array<string, list<string>>|null $errors */
    public static function error(
        ResponseInterface $response,
        string $code,
        string $message,
        int $status,
        ?array $errors = null,
    ): ResponseInterface {
        $payload = ['success' => false, 'code' => $code, 'message' => $message];
        if ($errors !== null) {
            $payload['errors'] = $errors;
        }
        $response->getBody()->write(json_encode(
            $payload,
            JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES,
        ));

        return $response
            ->withStatus($status)
            ->withHeader('Content-Type', 'application/json; charset=utf-8')
            ->withHeader('Cache-Control', 'no-store');
    }
}
