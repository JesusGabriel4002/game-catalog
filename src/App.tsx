import axios from 'axios'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import {
  Link,
  Outlet,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router'
import { useMemo, useState } from 'react'

type Deal = {
  dealID: string
  title: string
  salePrice: string
  normalPrice: string
  savings: string
  steamRatingText: string
  steamRatingPercent: string
  thumb: string
  storeID: string
}

type Store = {
  storeID: string
  storeName: string
  isActive: number
}

type DealsResponse = {
  deals: Deal[]
  totalPages: number
}

type Filters = {
  search: string
  storeId: string
  maxPrice: string
  page: number
}

const PAGE_SIZE = 12

const api = axios.create({
  baseURL: 'https://www.cheapshark.com/api/1.0',
})

async function fetchStores() {
  const response = await api.get<Store[]>('/stores')

  return response.data.filter((store) => store.isActive === 1)
}

async function fetchDeals(filters: Filters): Promise<DealsResponse> {
  const response = await api.get<Deal[]>('/deals', {
    params: {
      pageSize: PAGE_SIZE,
      pageNumber: filters.page,
      title: filters.search || undefined,
      storeID: filters.storeId || undefined,
      upperPrice: filters.maxPrice || undefined,
    },
  })

  return {
    deals: response.data,
    totalPages: Number(response.headers['x-total-page-count'] ?? 1),
  }
}

function formatCurrency(value: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(Number(value))
}

function formatSavings(value: string) {
  return `${Math.round(Number(value))}% OFF`
}

function RootLayout() {
  return (
    <div className="app-shell">
      <header className="hero-shell">
        <div className="hero-content">
          <div className="hero-copy">
            <span className="eyebrow">Portfolio project</span>
            <h1>Game Catalog</h1>
            <p>
              A responsive React + TypeScript catalog that consumes a public
              REST API with Axios, handles async states with TanStack Query and
              demonstrates client-side routing with TanStack Router.
            </p>
          </div>

          <nav className="top-nav" aria-label="Main navigation">
            <Link to="/" className="nav-link" activeProps={{ className: 'nav-link active' }}>
              Catalog
            </Link>
            <Link
              to="/about"
              className="nav-link"
              activeProps={{ className: 'nav-link active' }}
            >
              About
            </Link>
          </nav>
        </div>
      </header>

      <main className="page-shell">
        <Outlet />
      </main>
    </div>
  )
}

function CatalogPage() {
  const [filters, setFilters] = useState<Filters>({
    search: '',
    storeId: '',
    maxPrice: '',
    page: 0,
  })
  const [draftSearch, setDraftSearch] = useState('')

  const storesQuery = useQuery({
    queryKey: ['stores'],
    queryFn: fetchStores,
    staleTime: 1000 * 60 * 60,
  })

  const dealsQuery = useQuery({
    queryKey: ['deals', filters],
    queryFn: () => fetchDeals(filters),
    placeholderData: keepPreviousData,
  })

  const storesById = useMemo(
    () =>
      new Map((storesQuery.data ?? []).map((store) => [store.storeID, store.storeName])),
    [storesQuery.data],
  )

  const hasActiveFilters = Boolean(filters.search || filters.storeId || filters.maxPrice)

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFilters((current) => ({
      ...current,
      search: draftSearch.trim(),
      page: 0,
    }))
  }

  function handleReset() {
    setDraftSearch('')
    setFilters({
      search: '',
      storeId: '',
      maxPrice: '',
      page: 0,
    })
  }

  const deals = dealsQuery.data?.deals ?? []
  const totalPages = dealsQuery.data?.totalPages ?? 1
  const pageLabel = filters.page + 1

  return (
    <div className="stack">
      <section className="panel stats-grid">
        <StatCard label="Stack" value="React, TS, Query" />
        <StatCard label="Data source" value="CheapShark API" />
        <StatCard label="States covered" value="Loading, error, empty" />
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <h2>Browse deals</h2>
            <p>
              Search by title, filter by store and cap the maximum price. The
              list keeps the previous page visible while new data loads.
            </p>
          </div>
        </div>

        <form className="filters-grid" onSubmit={handleSubmit}>
          <label className="field">
            <span>Search title</span>
            <input
              value={draftSearch}
              onChange={(event) => setDraftSearch(event.target.value)}
              placeholder="Try Elden Ring, Hades, Hollow Knight..."
            />
          </label>

          <label className="field">
            <span>Store</span>
            <select
              value={filters.storeId}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  storeId: event.target.value,
                  page: 0,
                }))
              }
              disabled={storesQuery.isLoading}
            >
              <option value="">All stores</option>
              {(storesQuery.data ?? []).map((store) => (
                <option key={store.storeID} value={store.storeID}>
                  {store.storeName}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Max price (USD)</span>
            <input
              type="number"
              min="0"
              step="1"
              value={filters.maxPrice}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  maxPrice: event.target.value,
                  page: 0,
                }))
              }
              placeholder="40"
            />
          </label>

          <div className="actions">
            <button type="submit" className="primary-button">
              Apply search
            </button>
            <button type="button" className="ghost-button" onClick={handleReset}>
              Reset
            </button>
          </div>
        </form>
      </section>

      {storesQuery.isError ? (
        <StatusPanel
          title="Could not load stores"
          body="The API request for stores failed. Refresh the page to try again."
          tone="error"
        />
      ) : null}

      {dealsQuery.isError ? (
        <StatusPanel
          title="Could not load deals"
          body="The deal request failed. This screen intentionally surfaces the error state instead of hiding it."
          tone="error"
        />
      ) : null}

      {dealsQuery.isLoading ? (
        <StatusPanel
          title="Loading deals"
          body="Fetching the first page from the API and preparing the catalog."
          tone="loading"
        />
      ) : null}

      {!dealsQuery.isLoading && !dealsQuery.isError && deals.length === 0 ? (
        <StatusPanel
          title="No deals found"
          body={
            hasActiveFilters
              ? 'Try removing a filter or broadening the search term.'
              : 'The API returned no deals for this page.'
          }
          tone="empty"
        />
      ) : null}

      {!dealsQuery.isLoading && !dealsQuery.isError && deals.length > 0 ? (
        <>
          <section className="section-heading inline">
            <div>
              <h2>Results</h2>
              <p>
                Page {pageLabel} of {totalPages}
                {dealsQuery.isFetching ? ' · Updating data…' : ''}
              </p>
            </div>
          </section>

          <section className="deal-grid">
            {deals.map((deal) => (
              <article className="deal-card" key={deal.dealID}>
                <img
                  className="deal-thumb"
                  src={deal.thumb}
                  alt={`Cover art for ${deal.title}`}
                  loading="lazy"
                />

                <div className="deal-body">
                  <div className="deal-meta">
                    <span className="pill accent">
                      {storesById.get(deal.storeID) ?? 'Store unavailable'}
                    </span>
                    <span className="pill">{formatSavings(deal.savings)}</span>
                  </div>

                  <div className="deal-copy">
                    <h3>{deal.title}</h3>
                    <p>
                      Rating:{' '}
                      {deal.steamRatingText && deal.steamRatingPercent
                        ? `${deal.steamRatingText} (${deal.steamRatingPercent}%)`
                        : 'Not available'}
                    </p>
                  </div>

                  <div className="deal-prices">
                    <strong>{formatCurrency(deal.salePrice)}</strong>
                    <span>{formatCurrency(deal.normalPrice)}</span>
                  </div>
                </div>
              </article>
            ))}
          </section>

          <section className="panel pagination-row">
            <div>
              <h2>Pagination</h2>
              <p>
                Uses the `X-Total-Page-Count` response header exposed by the
                API.
              </p>
            </div>

            <div className="pagination-controls">
              <button
                type="button"
                className="ghost-button"
                onClick={() =>
                  setFilters((current) => ({
                    ...current,
                    page: Math.max(current.page - 1, 0),
                  }))
                }
                disabled={filters.page === 0 || dealsQuery.isFetching}
              >
                Previous
              </button>

              <span className="page-indicator">
                {pageLabel} / {totalPages}
              </span>

              <button
                type="button"
                className="primary-button"
                onClick={() =>
                  setFilters((current) => ({
                    ...current,
                    page: Math.min(current.page + 1, Math.max(totalPages - 1, 0)),
                  }))
                }
                disabled={filters.page >= totalPages - 1 || dealsQuery.isFetching}
              >
                Next
              </button>
            </div>
          </section>
        </>
      ) : null}
    </div>
  )
}

function AboutPage() {
  return (
    <div className="stack">
      <section className="panel">
        <div className="section-heading">
          <div>
            <h2>Why this project exists</h2>
            <p>
              This project was built as a frontend portfolio piece focused on
              practical product concerns: responsive layout, async states,
              reusable UI pieces and clear data flow.
            </p>
          </div>
        </div>

        <div className="about-grid">
          <FeatureCard
            title="Routing"
            body="Client-side navigation is handled with TanStack Router using a catalog screen and a secondary about route."
          />
          <FeatureCard
            title="Server state"
            body="REST data is fetched with Axios and orchestrated with TanStack Query, including previous-data preservation during pagination."
          />
          <FeatureCard
            title="State design"
            body="The UI explicitly covers loading, error and empty states instead of assuming the happy path."
          />
          <FeatureCard
            title="Responsiveness"
            body="The layout adapts from a single-column mobile flow to a denser desktop grid while preserving readability."
          />
        </div>
      </section>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  )
}

function FeatureCard({ title, body }: { title: string; body: string }) {
  return (
    <article className="feature-card">
      <h3>{title}</h3>
      <p>{body}</p>
    </article>
  )
}

function StatusPanel({
  title,
  body,
  tone,
}: {
  title: string
  body: string
  tone: 'loading' | 'error' | 'empty'
}) {
  return (
    <section className={`status-panel ${tone}`}>
      <h2>{title}</h2>
      <p>{body}</p>
    </section>
  )
}

const rootRoute = createRootRoute({
  component: RootLayout,
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: CatalogPage,
})

const aboutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/about',
  component: AboutPage,
})

const routeTree = rootRoute.addChildren([indexRoute, aboutRoute])

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  defaultPendingMs: 200,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
