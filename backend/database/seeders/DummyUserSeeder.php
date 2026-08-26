<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class DummyUserSeeder extends Seeder
{
    /**
     * Cria um usuário dummy e gera um token Sanctum fixo.
     *
     * Este token é usado pelo frontend para autenticar requisições
     * sem necessidade de fluxo de login real.
     *
     * IMPORTANTE: Esta é uma solução de desenvolvimento. Em produção,
     * implemente autenticação real.
     */
    public function run(): void
    {
        // Evita criar duplicata se rodar o seeder mais de uma vez
        $user = User::firstOrCreate(
            ['email' => 'dummy@enquetes.dev'],
            [
                'name'     => 'Dummy API User',
                'password' => bcrypt('dummy-password-not-used'),
            ]
        );

        // Deleta tokens antigos para evitar acúmulo
        $user->tokens()->delete();

        $token = $user->createToken('frontend-token')->plainTextToken;

        $this->command->info('');
        $this->command->info('╔══════════════════════════════════════════════════════╗');
        $this->command->info('║           TOKEN SANCTUM GERADO (copie!)             ║');
        $this->command->info('╠══════════════════════════════════════════════════════╣');
        $this->command->info('║  ' . $token);
        $this->command->info('╠══════════════════════════════════════════════════════╣');
        $this->command->info('║  Cole em: frontend/.env                             ║');
        $this->command->info('║  VITE_SANCTUM_TOKEN=<token acima>                   ║');
        $this->command->info('╚══════════════════════════════════════════════════════╝');
        $this->command->info('');
    }
}
