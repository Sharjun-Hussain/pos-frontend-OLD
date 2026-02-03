import ReturnDetails from "@/components/purchase/returns/ReturnDetails";
import React from "react";

const Page = async ({ params }) => {
    const { id } = await params;
    return <ReturnDetails id={id} />;
};

export default Page;

export const metadata = {
    title: "Return Details | EMI-POS",
    description: "View purchase return details",
};
