<?php
declare(strict_types=1);

/**
 * Kök .env dosyasını okur (private repo). Composer gerekmez.
 */
final class EnvLoader
{
    private static bool $loaded = false;

    /** @var array<string, string> */
    private static array $vars = [];

    public static function load(?string $path = null): void
    {
        if (self::$loaded) {
            return;
        }
        $path = $path ?? dirname(__FILE__) . DIRECTORY_SEPARATOR . '.env';
        if (!is_readable($path)) {
            self::$loaded = true;
            return;
        }
        $lines = file($path, FILE_IGNORE_NEW_LINES);
        if ($lines === false) {
            self::$loaded = true;
            return;
        }
        foreach ($lines as $line) {
            $line = trim($line);
            if ($line === '' || str_starts_with($line, '#')) {
                continue;
            }
            $pos = strpos($line, '=');
            if ($pos === false) {
                continue;
            }
            $key = trim(substr($line, 0, $pos));
            $value = trim(substr($line, $pos + 1));
            if (
                (str_starts_with($value, '"') && str_ends_with($value, '"'))
                || (str_starts_with($value, "'") && str_ends_with($value, "'"))
            ) {
                $value = substr($value, 1, -1);
            }
            $value = str_replace('\\n', "\n", $value);
            self::$vars[$key] = $value;
            if (function_exists('putenv')) {
                putenv($key . '=' . $value);
            }
            $_ENV[$key] = $value;
        }
        self::$loaded = true;
    }

    public static function get(string $key, ?string $default = null): ?string
    {
        if (!self::$loaded) {
            self::load();
        }
        return self::$vars[$key] ?? $default;
    }

    public static function bool(string $key, bool $default = false): bool
    {
        $v = self::get($key);
        if ($v === null) {
            return $default;
        }
        return in_array(strtolower($v), ['1', 'true', 'yes', 'on'], true);
    }

    /** Proje köküne göre göreli yol → mutlak dosya yolu */
    public static function path(string $key, string $defaultRelative): string
    {
        $rel = self::get($key, $defaultRelative) ?? $defaultRelative;
        $rel = str_replace(['/', '\\'], DIRECTORY_SEPARATOR, ltrim($rel, '/\\'));
        return dirname(__FILE__) . DIRECTORY_SEPARATOR . $rel;
    }
}
