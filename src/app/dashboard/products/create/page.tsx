import { redirect } from 'next/navigation';

export default function LegacyCreateProductRedirect() {
  redirect('/dashboard/products/addproduct');
}
