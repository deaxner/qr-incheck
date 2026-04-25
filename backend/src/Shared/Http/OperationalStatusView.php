<?php

namespace App\Shared\Http;

final readonly class OperationalStatusView
{
    /**
     * @param array{
     *   database: array{status:string},
     *   realtime: array{status:string, enabled:bool}
     * } $dependencies
     */
    public function __construct(
        public string $status,
        public string $service,
        public string $timestamp,
        public string $requestId,
        public array $dependencies,
    ) {
    }

    /**
     * @return array{
     *   status:string,
     *   service:string,
     *   timestamp:string,
     *   requestId:string,
     *   dependencies: array{
     *     database: array{status:string},
     *     realtime: array{status:string, enabled:bool}
     *   }
     * }
     */
    public function toArray(): array
    {
        return [
            'status' => $this->status,
            'service' => $this->service,
            'timestamp' => $this->timestamp,
            'requestId' => $this->requestId,
            'dependencies' => $this->dependencies,
        ];
    }
}
