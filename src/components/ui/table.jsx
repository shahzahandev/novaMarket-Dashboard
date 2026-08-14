import { cn } from "@/lib/utils";

export function Table({ className, ...props }) {
  return (
    <div className="w-full overflow-auto scrollbar-thin">
      <table className={cn("w-full caption-bottom text-sm", className)} {...props} />
    </div>
  );
}

export function TableHeader(props) {
  return <thead {...props} />;
}

export function TableBody(props) {
  return <tbody {...props} />;
}

export function TableRow({ className, ...props }) {
  return <tr className={cn("border-b transition-colors hover:bg-muted/45", className)} {...props} />;
}

export function TableHead({ className, ...props }) {
  return (
    <th
      className={cn("h-11 px-4 text-left align-middle text-xs font-semibold uppercase text-muted-foreground", className)}
      {...props}
    />
  );
}

export function TableCell({ className, ...props }) {
  return <td className={cn("px-4 py-3 align-middle", className)} {...props} />;
}
