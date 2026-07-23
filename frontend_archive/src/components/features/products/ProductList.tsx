import Image from "next/image";
import prisma from "@/lib/prisma";

interface ProductListProps {
    workspaceBrandId: string;
}

// Strictly a Server Component: Fetches securely natively on the server, ships 0kb of interactivity JS.
export default async function ProductList({ workspaceBrandId }: ProductListProps) {
    // Performance: Highly targeted query avoiding massive blob data (like descriptions/metadata) when unnecessary.
    const products = await prisma.product.findMany({
        where: { brandId: workspaceBrandId },
        select: {
            id: true,
            name: true,
            price: true,
            imageUrl: true
        },
        take: 24, // Performance: Edge-safe pagination limits
        orderBy: { createdAt: "desc" },
    });

    if (products.length === 0) {
        return (
            <div className="flex h-56 w-full flex-col items-center justify-center rounded-xl border border-dashed border-zinc-900 bg-zinc-900/5">
                <p className="text-sm text-zinc-400 font-medium">No products registered</p>
                <p className="text-xs text-zinc-500 mt-1 max-w-xs text-center">Add a product in the sidebar panel to see it displayed in this workspace.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
                <div
                    key={product.id}
                    className="group relative overflow-hidden rounded-xl border border-zinc-900 bg-zinc-900/10 transition-all duration-300 hover:border-zinc-800 hover:bg-zinc-900/20 hover:shadow-lg shadow-sm"
                >
                    <div className="relative h-48 w-full bg-zinc-950 border-b border-zinc-900 overflow-hidden">
                        {product.imageUrl ? (
                            /* Performance: next/image automatically generates webp, resizes according to device, and lazy loads */
                            <Image
                                src={product.imageUrl}
                                alt={`Image of ${product.name}`}
                                fill
                                sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                                loading="lazy"
                                quality={85}
                            />
                        ) : (
                            <div className="flex flex-col h-full items-center justify-center text-zinc-700">
                                <span className="text-[10px] uppercase tracking-widest font-mono font-bold text-zinc-600">No Asset</span>
                            </div>
                        )}
                    </div>

                    <div className="p-5 font-sans">
                        <h3 className="truncate text-sm font-semibold tracking-tight text-zinc-200" title={product.name}>
                            {product.name}
                        </h3>
                        {product.price ? (
                            <p className="mt-1.5 text-xs font-mono font-bold text-orange-500">${product.price.toFixed(2)}</p>
                        ) : (
                            <p className="mt-1.5 text-xs text-zinc-500">Unpriced</p>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );

}
