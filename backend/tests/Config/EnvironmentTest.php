<?php

declare(strict_types=1);

namespace GarzonTurnos\Api\Tests\Config;

use PHPUnit\Framework\TestCase;

final class EnvironmentTest extends TestCase
{
    public function testReadsVariablesExposedOnlyThroughTheProcessEnvironment(): void
    {
        $environmentClass = 'GarzonTurnos\\Api\\Config\\Environment';
        if (!class_exists($environmentClass)) {
            self::fail('Environment must read process variables used by PHP hosting runtimes.');
        }

        putenv('GARZON_TEST_SETTING=process-value');
        unset($_ENV['GARZON_TEST_SETTING'], $_SERVER['GARZON_TEST_SETTING']);

        try {
            self::assertSame('process-value', $environmentClass::get('GARZON_TEST_SETTING'));
        } finally {
            putenv('GARZON_TEST_SETTING');
        }
    }
}
