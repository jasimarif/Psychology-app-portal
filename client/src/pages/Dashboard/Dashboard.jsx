import { useAuth } from "@/context/AuthContext"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

function Dashboard() {
  const { currentUser } = useAuth()

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 px-4 bg-gray-50 animate-in fade-in duration-300 select-none">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Dashboard</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Header */}
          <div className="mb-4">
            <header className="select-none">
              <p className="text-xs font-medium tracking-[0.2em] uppercase text-customGreen mb-4">
                Welcome Back
              </p>
              <h1 className="text-5xl md:text-6xl font-light text-gray-700 tracking-tight mb-4">
                Dashboard
              </h1>
              <p className="text-lg text-gray-500 font-light max-w-xl">
                Manage your practice and connect with clients.
              </p>
            </header>
          </div>
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Welcome, {currentUser?.displayName || "Psychologist"}!</CardTitle>
                <CardDescription>
                  Email: {currentUser?.email}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500">
                  This is your psychologist portal dashboard. More features coming soon!
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default Dashboard
