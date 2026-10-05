import type { ReactNode } from 'react';
import { DOCUMENT_TYPE_LABELS, formatAmount, formatDate, formatLanguage } from '../lib/format';
import type { Insight } from '../lib/schema';

export function InsightDetails({ insight }: { insight: Insight }) {
  const { document, summary, keyPoints, entities, amounts, dates, keywords, warnings } = insight;

  return (
    <div className="insight">
      {warnings.length > 0 && (
        <div className="notice notice--warning" role="note">
          <strong>Uwagi</strong>
          <ul>
            {warnings.map((warning, index) => (
              <li key={index}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      <dl className="meta">
        <MetaItem label="Rodzaj">{DOCUMENT_TYPE_LABELS[document.type]}</MetaItem>
        <MetaItem label="Tytuł">{document.title ?? '—'}</MetaItem>
        <MetaItem label="Data">{document.date ? formatDate(document.date) : '—'}</MetaItem>
        <MetaItem label="Język">{formatLanguage(document.language)}</MetaItem>
        <MetaItem label="Strony">{document.pages}</MetaItem>
      </dl>

      <Section title="Podsumowanie">
        <p className="summary">{summary}</p>
      </Section>

      <Section title="Najważniejsze punkty">
        <ul className="key-points">
          {keyPoints.map((point, index) => (
            <li key={index}>{point}</li>
          ))}
        </ul>
      </Section>

      <div className="grid-2">
        <Section title="Organizacje">
          <TagList items={entities.organizations} />
        </Section>
        <Section title="Osoby">
          <TagList items={entities.people} />
        </Section>
      </div>

      <Section title={`Kwoty (${amounts.length})`}>
        <DataTable
          columns={['Kwota', 'Czego dotyczy']}
          rows={amounts.map(({ value, currency, context }) => [
            formatAmount(value, currency),
            context,
          ])}
        />
      </Section>

      <Section title={`Daty (${dates.length})`}>
        <DataTable
          columns={['Data', 'Czego dotyczy']}
          rows={dates.map(({ date, context }) => [formatDate(date), context])}
        />
      </Section>

      <Section title="Słowa kluczowe">
        <TagList items={keywords} />
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="insight__section">
      <h3>{title}</h3>
      {children}
    </section>
  );
}

function MetaItem({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="meta__item">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

function EmptyValue() {
  return <p className="muted">Brak w dokumencie</p>;
}

function TagList({ items }: { items: string[] }) {
  if (items.length === 0) return <EmptyValue />;
  return (
    <ul className="tags">
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
}

function DataTable({ columns, rows }: { columns: string[]; rows: string[][] }) {
  if (rows.length === 0) return <EmptyValue />;
  return (
    <div className="table-wrapper">
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column} scope="col">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((cells, rowIndex) => (
            <tr key={rowIndex}>
              {cells.map((cell, cellIndex) => (
                <td key={cellIndex}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
