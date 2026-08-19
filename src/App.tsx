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
      <header className="topbar">
        <div className="topbar-inner">
          <span className="logo">
            <span className="logo-dot" />
            GameDeals
          </span>
          <nav className="top-nav" aria-label="Main navigation">
            <Link to="/" className="nav-link" activeProps={{ className: 'nav-link active' }}>
              Deals
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
      <form className="filters-bar" onSubmit={handleSubmit}>
        <label className="field">
          <label htmlFor="search">Search</label>
          <input
            id="search"
            value={draftSearch}
            onChange={(event) => setDraftSearch(event.target.value)}
            placeholder="Elden Ring, Hades, Hollow Knight…"
          />
        </label>

        <label className="field">
          <label htmlFor="store">Store</label>
          <select
            id="store"
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
          <label htmlFor="maxprice">Max price (USD)</label>
          <input
            id="maxprice"
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
            placeholder="e.g. 20"
          />
        </label>

        <div className="filter-actions">
          <button type="submit" className="btn-primary">
            Search
          </button>
          <button type="button" className="btn-ghost" onClick={handleReset}>
            Clear
          </button>
        </div>
      </form>

      {storesQuery.isError ? (
        <StatusPanel
          title="Could not load stores"
          body="The stores request failed. Refresh the page to try again."
          tone="error"
        />
      ) : null}

      {dealsQuery.isError ? (
        <StatusPanel
          title="Could not load deals"
          body="The deal request failed. Check your connection and try again."
          tone="error"
        />
      ) : null}

      {dealsQuery.isLoading ? (
        <StatusPanel
          title="Loading…"
          body="Fetching deals from the API."
          tone="loading"
        />
      ) : null}

      {!dealsQuery.isLoading && !dealsQuery.isError && deals.length === 0 ? (
        <StatusPanel
          title="No deals found"
          body={
            hasActiveFilters
              ? 'No results for these filters. Try broadening your search.'
              : 'The API returned no deals for this page.'
          }
          tone="empty"
        />
      ) : null}

      {!dealsQuery.isLoading && !dealsQuery.isError && deals.length > 0 ? (
        <>
          <div className="results-meta">
            <h2>
              Page {pageLabel} of {totalPages}
              {dealsQuery.isFetching ? ' · Updating…' : ''}
            </h2>
          </div>

          <section className="deal-grid">
            {deals.map((deal) => (
              <article className="deal-card" key={deal.dealID}>
                <img
                  className="deal-thumb"
                  src={deal.thumb}
                  alt={deal.title}
                  loading="lazy"
                />
                <div className="deal-body">
                  <div className="deal-top-row">
                    <span className="deal-store">
                      {storesById.get(deal.storeID) ?? '—'}
                    </span>
                    <span className="deal-badge">{formatSavings(deal.savings)}</span>
                  </div>
                  <p className="deal-title">{deal.title}</p>
                  {deal.steamRatingText ? (
                    <p className="deal-rating">
                      {deal.steamRatingText} · {deal.steamRatingPercent}%
                    </p>
                  ) : null}
                  <div className="deal-prices">
                    <span className="deal-price-sale">{formatCurrency(deal.salePrice)}</span>
                    <span className="deal-price-original">{formatCurrency(deal.normalPrice)}</span>
                  </div>
                </div>
              </article>
            ))}
          </section>

          <div className="pagination">
            <span className="pagination-info">
              Showing page {pageLabel} of {totalPages}
            </span>
            <div className="pagination-controls">
              <button
                type="button"
                className="btn-ghost"
                onClick={() =>
                  setFilters((c) => ({ ...c, page: Math.max(c.page - 1, 0) }))
                }
                disabled={filters.page === 0 || dealsQuery.isFetching}
              >
                ← Previous
              </button>
              <span className="page-indicator">{pageLabel} / {totalPages}</span>
              <button
                type="button"
                className="btn-primary"
                onClick={() =>
                  setFilters((c) => ({
                    ...c,
                    page: Math.min(c.page + 1, Math.max(totalPages - 1, 0)),
                  }))
                }
                disabled={filters.page >= totalPages - 1 || dealsQuery.isFetching}
              >
                Next →
              </button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}

function AboutPage() {
  return (
    <div className="about-wrapper">
      <div className="about-header">
        <h1>About this project</h1>
        <p>
          GameDeals is a frontend portfolio project that consumes the CheapShark
          public API to list PC game deals. Built to demonstrate practical
          product concerns, not just "a working page".
        </p>
      </div>

      <div className="about-grid">
        <FeatureCard
          title="TanStack Router"
          body="Client-side routing with typed routes, preloading on hover and a clean separation between the catalog and about screens."
        />
        <FeatureCard
          title="TanStack Query + Axios"
          body="Server state management with request deduplication, stale-while-revalidate caching and previous-data preservation during pagination."
        />
        <FeatureCard
          title="Explicit async states"
          body="Loading, error and empty states are all handled in the UI instead of hiding behind a single spinner. Each has its own message and visual treatment."
        />
        <FeatureCard
          title="Responsive layout"
          body="Four columns on wide screens, three on medium, two on mobile, one on small phones — driven by CSS Grid without JavaScript."
        />
      </div>
    </div>
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
