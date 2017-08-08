<!doctype html>
<html lang="{{ app()->getLocale() }}">
    <head>
        <meta charset="utf-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}"> 

        <title>Community Watch</title>
    </head>
    <body>
        <div id="app">Loading....</div>
         <link rel="stylesheet" type="text/css" media="all" href="{{ mix('css/vendor-icons.css') }}" /> 
         <link rel="stylesheet" type="text/css" href="{{ mix('css/vendor.css') }}" /> 
        <link rel="stylesheet" type="text/css" href="{{ mix('css/app.css') }}" />
        <script src="{{ mix('js/manifest.js') }}"></script>
        <script src="{{ mix('js/vendor.js') }}"></script>
        <script src="{{ mix('js/bundle.js') }}"></script>
          <link href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700|Material+Icons|Lato|Open+Sans" rel="stylesheet" type="text/css">
    </body>
</html>
