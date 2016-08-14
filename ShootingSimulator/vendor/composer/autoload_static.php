<?php

// autoload_static.php @generated by Composer

namespace Composer\Autoload;

class ComposerStaticInit2212e655cf35c33d300c614407e58563
{
    public static $classMap = array (
        'nusoap_base' => __DIR__ . '/..' . '/deviservi/nusoap/lib/nusoap.php',
        'nusoap_client' => __DIR__ . '/..' . '/deviservi/nusoap/lib/nusoap.php',
        'soapclient' => __DIR__ . '/..' . '/deviservi/nusoap/lib/nusoap.php',
    );

    public static function getInitializer(ClassLoader $loader)
    {
        return \Closure::bind(function () use ($loader) {
            $loader->classMap = ComposerStaticInit2212e655cf35c33d300c614407e58563::$classMap;

        }, null, ClassLoader::class);
    }
}