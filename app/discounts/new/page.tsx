"use client";

import Layout from "../../components/Layout";
import DiscountForm from "../components/DiscountForm";

export default function CreateDiscountPage() {
  return (
    <Layout>
      <div className="text-black">
        <h1 className="mb-6 text-3xl font-bold">Create Discount</h1>
        <DiscountForm />
      </div>
    </Layout>
  );
}