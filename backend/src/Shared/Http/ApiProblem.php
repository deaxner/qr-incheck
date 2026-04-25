<?php

namespace App\Shared\Http;

final readonly class ApiProblem
{
    /**
     * @param array<string, mixed> $details
     */
    public function __construct(
        public string $code,
        public string $message,
        public string $requestId,
        public array $details = [],
    ) {
    }

    /**
     * @return array{
     *   code:string,
     *   message:string,
     *   requestId:string,
     *   details?:array<string, mixed>
     * }
     */
    public function toArray(): array
    {
        $payload = [
            'code' => $this->code,
            'message' => $this->message,
            'requestId' => $this->requestId,
        ];

        if ([] !== $this->details) {
            $payload['details'] = $this->details;
        }

        return $payload;
    }
}
