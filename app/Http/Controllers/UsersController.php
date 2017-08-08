<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\User;

use JWTAuth;
use Auth;
use Tymon\JWTAuth\Exceptions\JWTException;

class UsersController extends Controller
{
    public function login(Request $request)
    {
        $credentials = $request->only('email', 'password');

        try {
            if (! $token = JWTAuth::attempt($credentials)) {
                $data = [
                    "status" => false,
                    "message" => "username or password incorrect",
                ];
                return response()->json($data, 401);
            }
        } catch (JWTException $e) {
            $data = [
                "status" => false,
                "message" => "could not create token",
            ];
            return response()->json($data, 500);
        }

        $data = [
            "status" => true,
            "message" => "successfully logged in",
            'token' => $token,
            "data" => Auth::user()
        ];

        return response()->json($data, 200);
    }

    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
        $users = User::get();
        return response()->json($users, 200);
    }

    /**
     * Store a newly created resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request)
    {
        $user = User::create($request->all());
        return response()->json($user, 200);
    }

    /**
     * Display the specified resource.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function show($id)
    {
        $user = User::find($id)->first();
        return response()->json($user, 200);
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function destroy($id)
    {
        //
    }
}
