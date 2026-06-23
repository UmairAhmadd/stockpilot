import Sidebar from './Sidebar'
import Header from './Header'

export default function PageLayout({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-canvas lg:flex">
      <Sidebar />
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="mx-auto max-w-[1200px]">
          <Header title={title} />
          {children}
        </div>
      </main>
    </div>
  )
}
