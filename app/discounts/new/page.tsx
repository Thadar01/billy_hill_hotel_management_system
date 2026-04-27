"use client";

import Layout from "../../components/Layout";
import { useRouter } from "next/navigation";
import DiscountForm from "../components/DiscountForm";

export default function CreateDiscountPage() {
  const router = useRouter();
  return (
    <Layout>
      <div className="max-w-4xl mx-auto text-black">
        <div className="flex items-center gap-2 mb-6">
          {/* <button
            onClick={() => router.back()}
            className="text-black text-xl font-bold hover:text-gray-700 transition-colors"
            title="Back"
          >
            &#8592;
          </button> */}
          {/* <h1 className="text-3xl font-bold">Create Discount</h1> */}
        </div>
        <DiscountForm />
      </div>
    </Layout>
  );
}