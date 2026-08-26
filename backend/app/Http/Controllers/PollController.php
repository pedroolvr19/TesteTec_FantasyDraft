<?php

namespace App\Http\Controllers;

use App\Models\Poll;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PollController extends Controller
{
    /**
     * Lista todas as polls, com contagem de opções.
     */
    public function index(): JsonResponse
    {
        $polls = Poll::with('options')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn ($poll) => $this->formatPoll($poll));

        return response()->json($polls);
    }

    /**
     * Cria uma nova poll com suas opções dentro de uma transação.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'question'     => 'required|string|max:500',
            'creator_name' => 'required|string|max:100',
            'expires_at'   => 'nullable|date|after:now',
            'options'      => 'required|array|min:2|max:10',
            'options.*'    => 'required|string|max:200',
        ]);

        $poll = DB::transaction(function () use ($validated) {
            $poll = Poll::create([
                'question'     => $validated['question'],
                'creator_name' => $validated['creator_name'],
                'expires_at'   => $validated['expires_at'] ?? null,
            ]);

            foreach ($validated['options'] as $optionText) {
                $poll->options()->create([
                    'text'        => $optionText,
                    'votes_count' => 0,
                ]);
            }

            return $poll->load('options');
        });

        return response()->json($this->formatPoll($poll), 201);
    }

    /**
     * Retorna uma poll específica com suas opções e contagens.
     */
    public function show(Poll $poll): JsonResponse
    {
        $poll->load('options');

        return response()->json($this->formatPoll($poll));
    }

    /**
     * Formata a poll para resposta JSON consistente.
     */
    private function formatPoll(Poll $poll): array
    {
        $totalVotes = $poll->options->sum('votes_count');

        return [
            'id'           => $poll->id,
            'question'     => $poll->question,
            'creator_name' => $poll->creator_name,
            'expires_at'   => $poll->expires_at?->toIso8601String(),
            'is_expired'   => $poll->isExpired(),
            'total_votes'  => $totalVotes,
            'created_at'   => $poll->created_at->toIso8601String(),
            'options'      => $poll->options->map(fn ($opt) => [
                'id'          => $opt->id,
                'text'        => $opt->text,
                'votes_count' => $opt->votes_count,
                'percentage'  => $totalVotes > 0
                    ? round(($opt->votes_count / $totalVotes) * 100, 1)
                    : 0,
            ])->values(),
        ];
    }
}
