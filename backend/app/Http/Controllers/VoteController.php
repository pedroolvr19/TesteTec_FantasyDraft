<?php

namespace App\Http\Controllers;

use App\Models\Poll;
use App\Models\Vote;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Validation\ValidationException;

class VoteController extends Controller
{
    /**
     * Registra o voto de um usuário numa opção da poll.
     *
     * Regras de negócio:
     *  - option_id deve pertencer à poll
     *  - voter_id (UUID gerado no frontend) não pode ter votado nesta poll antes
     *  - polls expiradas rejeitam votos
     */
    public function store(Request $request, Poll $poll): JsonResponse
    {
        $validated = $request->validate([
            'option_id' => 'required|integer',
            'voter_id'  => 'required|string|size:36', // UUID v4
        ]);

        // Verifica se a poll expirou
        if ($poll->isExpired()) {
            throw ValidationException::withMessages([
                'poll' => ['Esta enquete já foi encerrada.'],
            ]);
        }

        // Verifica se a option pertence a esta poll
        $option = $poll->options()->find($validated['option_id']);
        if (! $option) {
            throw ValidationException::withMessages([
                'option_id' => ['Opção inválida para esta enquete.'],
            ]);
        }

        // Verifica voto duplicado: voter_id já votou em QUALQUER opção desta poll
        $alreadyVoted = Vote::whereIn('poll_option_id', $poll->options()->pluck('id'))
            ->where('voter_id', $validated['voter_id'])
            ->exists();

        if ($alreadyVoted) {
            throw ValidationException::withMessages([
                'voter_id' => ['Você já votou nesta enquete.'],
            ]);
        }

        // Salva o voto e incrementa a contagem (dentro de transação)
        DB::transaction(function () use ($option, $validated) {
            Vote::create([
                'poll_option_id' => $option->id,
                'voter_id'       => $validated['voter_id'],
            ]);
            $option->increment('votes_count');
        });

        // Recarrega poll com opções atualizadas para o payload
        $poll->load('options');
        $totalVotes = $poll->options->sum('votes_count');

        $optionsPayload = $poll->options->map(fn ($opt) => [
            'id'          => $opt->id,
            'text'        => $opt->text,
            'votes_count' => $opt->votes_count,
            'percentage'  => $totalVotes > 0
                ? round(($opt->votes_count / $totalVotes) * 100, 1)
                : 0,
        ])->values()->toArray();

        // Notifica o servidor Node.js via HTTP interno (bridge simples, sem Redis)
        // Se o Node estiver fora do ar, não bloqueia a resposta ao cliente
        try {
            Http::timeout(2)->post(env('WS_NODE_URL', 'http://localhost:3001') . '/broadcast', [
                'poll_id' => $poll->id,
                'options' => $optionsPayload,
            ]);
        } catch (\Exception $e) {
            // Falha silenciosa — o voto já foi salvo, apenas o broadcast falhou
            \Log::warning('WebSocket broadcast failed: ' . $e->getMessage());
        }

        return response()->json([
            'message'     => 'Voto registrado com sucesso.',
            'total_votes' => $totalVotes,
            'options'     => $optionsPayload,
        ], 201);
    }
}
