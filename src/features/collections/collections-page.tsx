/**
 * Collections arrive with plan item 7. The route exists so deep-link return
 * and lazy loading have a real destination; its content is a placeholder.
 */
export default function CollectionsPage() {
  return (
    <section>
      <h1 className="text-heading-sm font-semibold">Collections</h1>
      <p className="text-body text-muted-foreground">
        Collections arrive with a later slice.
      </p>
    </section>
  )
}
