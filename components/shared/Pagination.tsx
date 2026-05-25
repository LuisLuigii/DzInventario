import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function Pagination({ page, totalPages, onPageChange }: {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}) {
  if (totalPages <= 1) return null
  return (
    <div className="flex items-center justify-between pt-4 mt-2 border-t border-border/40">
      <p className="text-xs text-muted-foreground">
        Página <span className="font-semibold text-foreground/80">{page}</span> de <span className="font-semibold text-foreground/80">{totalPages}</span>
      </p>
      <div className="flex gap-1.5">
        <Button
          variant="outline" size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="h-8 w-8 p-0 border-border/60 hover:border-primary/40 hover:bg-primary/10 hover:text-primary cursor-pointer transition-all duration-150 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <Button
          variant="outline" size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="h-8 w-8 p-0 border-border/60 hover:border-primary/40 hover:bg-primary/10 hover:text-primary cursor-pointer transition-all duration-150 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}