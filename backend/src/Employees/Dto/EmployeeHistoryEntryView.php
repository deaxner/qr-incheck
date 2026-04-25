<?php

namespace App\Employees\Dto;

final readonly class EmployeeHistoryEntryView
{
    public function __construct(
        public string $id,
        public string $action,
        public string $timestamp,
        public string $location,
        public string $state,
        public string $stateLabel,
        public string $sortKey,
    ) {
    }

    /**
     * @return array{id:string,action:string,timestamp:string,location:string,state:string,stateLabel:string,sortKey:string}
     */
    public function toSortableArray(): array
    {
        return [
            'id' => $this->id,
            'action' => $this->action,
            'timestamp' => $this->timestamp,
            'location' => $this->location,
            'state' => $this->state,
            'stateLabel' => $this->stateLabel,
            'sortKey' => $this->sortKey,
        ];
    }

    /**
     * @return array{id:string,action:string,timestamp:string,location:string,state:string,stateLabel:string}
     */
    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'action' => $this->action,
            'timestamp' => $this->timestamp,
            'location' => $this->location,
            'state' => $this->state,
            'stateLabel' => $this->stateLabel,
        ];
    }
}
