$pages = @(
    @{
        Path = "src\app\page.jsx"
        Content = @"
`"use client`";
import React from 'react';
import { useRouter } from 'next/navigation';
import Home from '../pages/Home';
import { useApp } from '../context/AppContext';

export default function Page() {
  const router = useRouter();
  const { promotions } = useApp();
  return <Home onNavigate={(p) => router.push('/' + p)} onNavigateProduct={(id) => router.push('/product/' + id)} onSelectCategory={(cat) => router.push('/catalog?category=' + cat)} promotions={promotions} />;
}
"@
    },
    @{
        Path = "src\app\catalog\page.jsx"
        Content = @"
`"use client`";
import React, { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ProductCatalog from '../../pages/ProductCatalog';
import { useApp } from '../../context/AppContext';

function CatalogContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { promotions } = useApp();
  const category = searchParams.get('category') || 'all';
  const search = searchParams.get('search') || '';
  
  return <ProductCatalog currentCategory={category} onSelectCategory={(cat) => router.push('/catalog?category=' + cat)} searchQuery={search} onNavigateProduct={(id) => router.push('/product/' + id)} promotions={promotions} />;
}

export default function Page() {
  return <Suspense fallback={<div>Loading...</div>}><CatalogContent /></Suspense>;
}
"@
    },
    @{
        Path = "src\app\product\[id]\page.jsx"
        Content = @"
`"use client`";
import React from 'react';
import { useRouter } from 'next/navigation';
import ProductDetails from '../../../pages/ProductDetails';
import { useApp } from '../../../context/AppContext';

export default function Page({ params }) {
  const router = useRouter();
  const { promotions } = useApp();
  // params in client component can be unwrapped with React.use(params) in Next.js 15, or just accessed if it's sync. Next.js 14 params are synchronous for client components usually, but Next.js 15 makes them async. Let's use React.use() just in case, or just params.id.
  const id = params?.id || React.use(params).id;
  
  return <ProductDetails productId={id} onNavigate={(p) => router.push('/' + p)} promotions={promotions} onBuyNow={() => router.push('/cart')} />;
}
"@
    },
    @{
        Path = "src\app\cart\page.jsx"
        Content = @"
`"use client`";
import React from 'react';
import { useRouter } from 'next/navigation';
import CartPage from '../../pages/CartPage';

export default function Page() {
  const router = useRouter();
  return <CartPage onNavigate={(p) => router.push('/' + p)} onCheckout={() => router.push('/checkout')} />;
}
"@
    },
    @{
        Path = "src\app\checkout\page.jsx"
        Content = @"
`"use client`";
import React, { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Checkout from '../../pages/Checkout';

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const coins = searchParams.get('coins') === 'true';
  return <Checkout useCoinsDiscount={coins} onNavigate={(p) => router.push('/' + p)} />;
}

export default function Page() {
  return <Suspense fallback={<div>Loading...</div>}><CheckoutContent /></Suspense>;
}
"@
    },
    @{
        Path = "src\app\admin\page.jsx"
        Content = @"
`"use client`";
import React from 'react';
import { useRouter } from 'next/navigation';
import AdminDashboard from '../../pages/AdminDashboard';
import { useApp } from '../../context/AppContext';

export default function Page() {
  const router = useRouter();
  const { promotions } = useApp();
  return <AdminDashboard onNavigate={(p) => router.push('/' + p)} promotions={promotions} onUpdatePromotions={() => window.location.reload()} />;
}
"@
    },
    @{
        Path = "src\app\orders\page.jsx"
        Content = @"
`"use client`";
import React from 'react';
import { useRouter } from 'next/navigation';
import Orders from '../../pages/Orders';

export default function Page() {
  const router = useRouter();
  return <Orders onNavigateProduct={(id) => router.push('/product/' + id)} />;
}
"@
    },
    @{
        Path = "src\app\profile\page.jsx"
        Content = @"
`"use client`";
import React from 'react';
import { useRouter } from 'next/navigation';
import ProfilePage from '../../pages/ProfilePage';

export default function Page() {
  const router = useRouter();
  return <ProfilePage onNavigate={(p) => router.push('/' + p)} />;
}
"@
    },
    @{
        Path = "src\app\categories\page.jsx"
        Content = @"
`"use client`";
import React from 'react';
import { useRouter } from 'next/navigation';
import CategoriesPage from '../../pages/CategoriesPage';
import { useApp } from '../../context/AppContext';

export default function Page() {
  const router = useRouter();
  const { promotions } = useApp();
  return <CategoriesPage onNavigate={(p) => router.push('/' + p)} onSelectCategory={(cat) => router.push('/catalog?category=' + cat)} onNavigateProduct={(id) => router.push('/product/' + id)} promotions={promotions} onSearch={(query) => router.push('/catalog?search=' + encodeURIComponent(query))} />;
}
"@
    },
    @{
        Path = "src\app\partner\page.jsx"
        Content = @"
`"use client`";
import React from 'react';
import PartnerCenter from '../../pages/PartnerCenter';

export default function Page() {
  return <PartnerCenter />;
}
"@
    },
    @{
        Path = "src\app\seller\page.jsx"
        Content = @"
`"use client`";
import React from 'react';
import { useRouter } from 'next/navigation';
import SellerDashboard from '../../pages/SellerDashboard';

export default function Page() {
  const router = useRouter();
  return <SellerDashboard onNavigate={(p) => router.push('/' + p)} />;
}
"@
    }
)

foreach ($page in $pages) {
    Set-Content -Path $page.Path -Value $page.Content
}
