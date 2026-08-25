<?php

declare(strict_types=1);

namespace GarzonTurnos\Api\Tests\Config;

use PDO;
use PHPUnit\Framework\TestCase;

final class DatabaseFactoryTest extends TestCase
{
    public function testCreatesStrictPdoConnectionFromExplicitConfiguration(): void
    {
        $factoryClass = 'GarzonTurnos\\Api\\Config\\DatabaseFactory';
        if (!class_exists($factoryClass)) {
            self::fail('DatabaseFactory must create the PDO boundary from explicit configuration.');
        }

        $database = $factoryClass::create([
            'DB_DSN' => 'sqlite::memory:',
            'DB_USER' => '',
            'DB_PASSWORD' => '',
        ]);

        self::assertInstanceOf(PDO::class, $database);
        self::assertSame(PDO::ERRMODE_EXCEPTION, $database->getAttribute(PDO::ATTR_ERRMODE));
        $statement = $database->prepare('SELECT :value AS value');
        $statement->execute(['value' => 'prepared']);
        self::assertSame('prepared', $statement->fetchColumn());
    }

    public function testMissingDsnFailsClosed(): void
    {
        $factoryClass = 'GarzonTurnos\\Api\\Config\\DatabaseFactory';
        if (!class_exists($factoryClass)) {
            self::fail('DatabaseFactory must reject incomplete configuration.');
        }

        $this->expectException(\RuntimeException::class);
        $factoryClass::create([]);
    }
}
