<?php

namespace Tests\Feature;

use App\Models\Poll;
use App\Models\PollOption;
use App\Models\User;
use App\Models\Vote;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class VoteTest extends TestCase
{
    use RefreshDatabase;

    private string $token;
    private Poll $poll;
    private PollOption $option;

    protected function setUp(): void
    {
        parent::setUp();

        // Cria usuário dummy e token para autenticação
        $user = User::factory()->create();
        $this->token = $user->createToken('test')->plainTextToken;

        // Cria poll com duas opções
        $this->poll = Poll::create([
            'question'     => 'Qual linguagem você prefere?',
            'creator_name' => 'Tester',
        ]);

        $this->option = $this->poll->options()->create([
            'text'        => 'PHP',
            'votes_count' => 0,
        ]);

        $this->poll->options()->create([
            'text'        => 'Ruby',
            'votes_count' => 0,
        ]);
    }

    private function authHeaders(): array
    {
        return ['Authorization' => 'Bearer ' . $this->token];
    }

    /** @test */
    public function test_usuario_pode_votar_numa_opcao(): void
    {
        $response = $this->postJson(
            "/api/polls/{$this->poll->id}/vote",
            ['option_id' => $this->option->id, 'voter_id' => 'aaaaaaaa-0000-4000-8000-000000000001'],
            $this->authHeaders()
        );

        $response->assertStatus(201)
            ->assertJsonPath('message', 'Voto registrado com sucesso.');

        $this->assertDatabaseHas('votes', [
            'poll_option_id' => $this->option->id,
            'voter_id'       => 'aaaaaaaa-0000-4000-8000-000000000001',
        ]);

        $this->option->refresh();
        $this->assertEquals(1, $this->option->votes_count);
    }

    /** @test */
    public function test_impede_voto_duplicado_mesmo_voter_id(): void
    {
        $voterId = 'aaaaaaaa-0000-4000-8000-000000000002';

        // Primeiro voto — deve passar
        $this->postJson(
            "/api/polls/{$this->poll->id}/vote",
            ['option_id' => $this->option->id, 'voter_id' => $voterId],
            $this->authHeaders()
        )->assertStatus(201);

        // Segundo voto do mesmo voter_id — deve falhar com 422
        $response = $this->postJson(
            "/api/polls/{$this->poll->id}/vote",
            ['option_id' => $this->option->id, 'voter_id' => $voterId],
            $this->authHeaders()
        );

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['voter_id']);

        // Garante que só existe 1 vote no banco
        $this->assertEquals(1, Vote::count());
    }

    /** @test */
    public function test_impede_voto_em_opcao_diferente_da_mesma_poll(): void
    {
        $voterId = 'aaaaaaaa-0000-4000-8000-000000000003';
        $outroOption = $this->poll->options->last();

        // Vota na primeira opção
        $this->postJson(
            "/api/polls/{$this->poll->id}/vote",
            ['option_id' => $this->option->id, 'voter_id' => $voterId],
            $this->authHeaders()
        )->assertStatus(201);

        // Tenta votar na segunda opção da mesma poll — deve falhar
        $response = $this->postJson(
            "/api/polls/{$this->poll->id}/vote",
            ['option_id' => $outroOption->id, 'voter_id' => $voterId],
            $this->authHeaders()
        );

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['voter_id']);
    }

    /** @test */
    public function test_rejeita_option_id_de_outra_poll(): void
    {
        $outraPoll = Poll::create([
            'question'     => 'Outra poll',
            'creator_name' => 'Tester',
        ]);
        $outroOption = $outraPoll->options()->create([
            'text'        => 'Opção alheia',
            'votes_count' => 0,
        ]);

        $response = $this->postJson(
            "/api/polls/{$this->poll->id}/vote",
            ['option_id' => $outroOption->id, 'voter_id' => 'aaaaaaaa-0000-4000-8000-000000000004'],
            $this->authHeaders()
        );

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['option_id']);
    }

    /** @test */
    public function test_nao_aceita_voter_id_invalido(): void
    {
        $response = $this->postJson(
            "/api/polls/{$this->poll->id}/vote",
            ['option_id' => $this->option->id, 'voter_id' => 'nao-e-um-uuid-valido'],
            $this->authHeaders()
        );

        // voter_id deve ter exatamente 36 caracteres
        $response->assertStatus(422)
            ->assertJsonValidationErrors(['voter_id']);
    }

    /** @test */
    public function test_cria_poll_com_opcoes(): void
    {
        $response = $this->postJson('/api/polls', [
            'question'     => 'Frontend favorito?',
            'creator_name' => 'Dev',
            'options'      => ['React', 'Vue', 'Svelte'],
        ], $this->authHeaders());

        $response->assertStatus(201)
            ->assertJsonPath('question', 'Frontend favorito?')
            ->assertJsonCount(3, 'options');

        $this->assertDatabaseHas('polls', ['question' => 'Frontend favorito?']);
    }
}
