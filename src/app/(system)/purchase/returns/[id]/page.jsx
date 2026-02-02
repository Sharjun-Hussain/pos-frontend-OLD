import ReturnDetails from "@/components/purchase/returns/ReturnDetails";
import React from "react";

const Page = ({ params }) => {
    return <ReturnDetails id={params.id} />;
};

export default Page;

export const metadata = {
    title: "Return Details | EMI-POS",
    description: "View purchase return details",
};
