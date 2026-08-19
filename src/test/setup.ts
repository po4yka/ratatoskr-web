import "@testing-library/jest-dom/vitest"
import { cleanup } from "@testing-library/react"
import { afterEach } from "vitest"

// Every test gets a clean document. Without this a component from an earlier test is still mounted,
// and a query that should find one element finds two.
afterEach(cleanup)
