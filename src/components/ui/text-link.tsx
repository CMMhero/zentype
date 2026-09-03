import Link from "next/link";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

type TextLinkProps = Omit<React.ComponentPropsWithoutRef<"a">, "href"> & {
  href: string;
};

/**
 * Text link styled like "back to typing" (Button variant="link", auto height,
 * no padding). Internal routes render next/link for client-side navigation;
 * external and mailto/tel hrefs keep a plain anchor.
 */
function TextLink({ href, className, children, ...props }: TextLinkProps) {
  const internal = href.startsWith("/");
  return (
    <Button
      variant="link"
      size="sm"
      render={internal ? <Link href={href} {...props} /> : <Link href={href} {...props} />}
      className={cn("h-auto gap-1 p-0", className)}
    >
      {children}
    </Button>
  );
}

export { TextLink };
