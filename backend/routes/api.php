<?php

use App\Http\Controllers\PollController;
use App\Http\Controllers\VoteController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Todas as rotas estão protegidas por auth:sanctum.
|
| Como não há fluxo de login real, um usuário dummy é criado pelo seeder
| e seu token é configurado como variável de ambiente no frontend.
| Ver README.md → seção "Autenticação" para detalhes.
|
*/

Route::middleware('auth:sanctum')->group(function () {
    // Polls
    Route::get('/polls', [PollController::class, 'index']);
    Route::post('/polls', [PollController::class, 'store']);
    Route::get('/polls/{poll}', [PollController::class, 'show']);

    // Votos
    Route::post('/polls/{poll}/vote', [VoteController::class, 'store']);
});
