<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('votes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('poll_option_id')->constrained()->cascadeOnDelete();
            $table->string('voter_id', 36); // UUID gerado no frontend
            $table->timestamps();

            // Garante que cada voter_id só vota uma vez por opção (na verdade: por poll)
            // A validação de "uma vote por poll" é feita no controller
            $table->unique(['poll_option_id', 'voter_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('votes');
    }
};
