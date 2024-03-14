import Form from '@/app/ui/invoices/edit-form';
import Breadcrumbs from '@/app/ui/invoices/breadcrumbs';
import { fetchInvoiceById, fetchCustomers } from '@/app/lib/data';
 

export default async function Page({params}: {params: {id: string}}) {
    // enable function component to accept the params id props
    const id = params.id;

    // Fetch the invoice data by input id
    const [invoice, customers] = await Promise.all([
        fetchInvoiceById(id),
        fetchCustomers(),
    ]);

    return (
        <main>
        <Breadcrumbs
            breadcrumbs={[
            { label: 'Invoices', href: '/dashboard/invoices' },
            {
                label: 'Edit Invoice',
                href: `/dashboard/invoices/${id}/edit`,
                active: true,
            },
            ]}
        />
        <Form invoice={invoice} customers={customers} />
        </main>
    );
}