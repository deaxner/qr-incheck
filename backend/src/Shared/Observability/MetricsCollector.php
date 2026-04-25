<?php

namespace App\Shared\Observability;

use Psr\Cache\CacheItemPoolInterface;

final readonly class MetricsCollector
{
    private const CACHE_KEY = 'observability.metrics';

    public function __construct(
        private CacheItemPoolInterface $cache,
    ) {
    }

    /**
     * @param array<string, scalar> $labels
     */
    public function incrementCounter(string $name, array $labels = [], int $by = 1): void
    {
        $metrics = $this->load();
        $key = $this->buildSeriesKey($labels);

        if (!isset($metrics['counters'][$name][$key])) {
            $metrics['counters'][$name][$key] = [
                'labels' => $labels,
                'value' => 0,
            ];
        }

        $metrics['counters'][$name][$key]['value'] += $by;
        $this->save($metrics);
    }

    /**
     * @param array<string, scalar> $labels
     */
    public function setGauge(string $name, float|int $value, array $labels = []): void
    {
        $metrics = $this->load();
        $key = $this->buildSeriesKey($labels);
        $metrics['gauges'][$name][$key] = [
            'labels' => $labels,
            'value' => $value,
        ];

        $this->save($metrics);
    }

    public function exportPrometheus(): string
    {
        $metrics = $this->load();
        $lines = [];

        foreach ($metrics['counters'] as $name => $seriesSet) {
            $lines[] = sprintf('# TYPE %s counter', $name);

            foreach ($seriesSet as $series) {
                $lines[] = $this->formatMetricLine($name, $series['labels'], $series['value']);
            }
        }

        foreach ($metrics['gauges'] as $name => $seriesSet) {
            $lines[] = sprintf('# TYPE %s gauge', $name);

            foreach ($seriesSet as $series) {
                $lines[] = $this->formatMetricLine($name, $series['labels'], $series['value']);
            }
        }

        return implode("\n", $lines).("\n" === end($lines) ? '' : "\n");
    }

    /**
     * @return array{
     *   counters: array<string, array<string, array{labels: array<string, scalar>, value: int|float}>>,
     *   gauges: array<string, array<string, array{labels: array<string, scalar>, value: int|float}>>
     * }
     */
    private function load(): array
    {
        $item = $this->cache->getItem(self::CACHE_KEY);
        $metrics = $item->get();

        if (!is_array($metrics)) {
            return [
                'counters' => [],
                'gauges' => [],
            ];
        }

        return $metrics;
    }

    /**
     * @param array{
     *   counters: array<string, array<string, array{labels: array<string, scalar>, value: int|float}>>,
     *   gauges: array<string, array<string, array{labels: array<string, scalar>, value: int|float}>>
     * } $metrics
     */
    private function save(array $metrics): void
    {
        $item = $this->cache->getItem(self::CACHE_KEY);
        $item->set($metrics);
        $this->cache->save($item);
    }

    /**
     * @param array<string, scalar> $labels
     */
    private function buildSeriesKey(array $labels): string
    {
        ksort($labels);

        return md5((string) json_encode($labels, JSON_THROW_ON_ERROR));
    }

    /**
     * @param array<string, scalar> $labels
     */
    private function formatMetricLine(string $name, array $labels, float|int $value): string
    {
        if ([] === $labels) {
            return sprintf('%s %s', $name, $value);
        }

        ksort($labels);
        $labelPairs = [];

        foreach ($labels as $key => $labelValue) {
            $labelPairs[] = sprintf('%s="%s"', $key, $this->escapeLabelValue((string) $labelValue));
        }

        return sprintf('%s{%s} %s', $name, implode(',', $labelPairs), $value);
    }

    private function escapeLabelValue(string $value): string
    {
        return str_replace(
            ["\\", "\"", "\n"],
            ["\\\\", "\\\"", "\\n"],
            $value,
        );
    }
}
