<!doctype html>
<html lang="{{ app()->getLocale() }}">
    <head>
        <meta charset="utf-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}"> 
        <link href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700|Material+Icons" rel="stylesheet" type="text/css">
        <link href="https://fonts.googleapis.com/css?family=Lato|Open+Sans" rel="stylesheet">

        <title>Laravel</title>
        <link rel="stylesheet" type="text/css" href="{{ mix('css/vendor-icons.css') }}" />
         <link rel="stylesheet" type="text/css" href="{{ mix('css/vendor.css') }}" /> 
        <link rel="stylesheet" type="text/css" href="{{ mix('css/app.css') }}" />
    </head>
    <body>
        <div id="app"></div>
        <script src="{{ mix('js/manifest.js') }}"></script>
        <script src="{{ mix('js/vendor.js') }}"></script>
        <script src="{{ mix('js/bundle.js') }}"></script>
    </body>
</html>
