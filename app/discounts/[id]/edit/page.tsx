"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Layout from "../../../components/Layout";
import DiscountForm from "../../components/DiscountForm";

interface Discount {
  discountID: number;
  discountName: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  startDate: string;
  endDate: string;
  description: string | null;
  isActive: boolean;
  roomIDs: string[];
}

export default function EditDiscountPage() {
  const params = useParams();
  const id = params.id as string;

  const [discount, setDiscount] = useState<Discount | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDiscount = async () => {
      try {
        const res = await fetch(`/api/discounts/${id}`, {
          cache: "no-store",
        });
        const data = await res.json();

        if (res.ok) {
          setDiscount(data.discount);
          console.log(discount?.roomIDs)
        } else {
          alert(data.error || "Failed to load discount");
        }
      } catch (error) {
        console.error("Failed to load discount:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) loadDiscount();
  }, [id]);

  if (loading) {
    return (
      <Layout>
        <div className="p-8 text-black">Loading discount...</div>
      </Layout>
    );
  }

  if (!discount) {
    return (
      <Layout>
        <div className="p-8 text-black">Discount not found.</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="text-black">
        <DiscountForm
          editingId={discount.discountID}
          initialData={{
            discountName: discount.discountName,
            discountType: discount.discountType,
            discountValue: String(discount.discountValue),
            startDate: discount.startDate ? discount.startDate.slice(0, 16) : "",
            endDate: discount.endDate ? discount.endDate.slice(0, 16) : "",
            description: discount.description || "",
            isActive: discount.isActive,
            roomIDs: discount.roomIDs || [],
          }}
        />
      </div>
    </Layout>
  );
}