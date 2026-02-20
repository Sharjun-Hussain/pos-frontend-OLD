"use client";

import { useState, useEffect, useReducer, useRef, forwardRef } from "react";
import clsx from "clsx";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import {
  Trash2,
  Plus,
  Minus,
  ListRestart,
  Search,
  X,
  CreditCard,
  Wallet,
  ImageIcon,
  Users,
  ShoppingCart,
  DollarSign,
  List,
  MonitorX,
  Calculator,
  Maximize,
  Minimize,
  Archive, // For Hold List / Sale List
  PackageSearch, // For Check Stock
  Printer, // For Reprint
  ArrowLeftRight, // For Transfer
  Undo, // For Return
  Tag, // For Change Price & Voucher
  FlaskConical, // For Branch Item
  ChevronDown,
  ArrowLeft,
  Landmark,
  Loader2,
  RotateCcw,
  Store,
  Truck,
  Eye,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/useDebounce";
import { useReactToPrint } from "react-to-print";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useSettings } from "@/app/hooks/swr/useSettings";
import { ReceiptTemplate } from "./ReceiptTemplate";
import SaleDetailSheet from "./SaleDetailSheet";
import SalesReturnDialog from "./SalesReturnDialog";
import { useBeep } from "@/hooks/use-beep";
import { 
  Banknote, 
  QrCode, 
  Smartphone, 
  Globe
} from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

// --- Mock Data ---
import { EmployeeSelector } from "./employee-selector";

// --- State Management ---
function appReducer(state, action) {
  switch (action.type) {
    case "ADD_ITEM": {
      const { product } = action.payload; // product here is a flattened variant object
      const price = state.isWholesale
        ? product.wholesalePrice
        : product.retailPrice;
      const existingItemIndex = state.cart.findIndex(
        (item) => item.variantId === product.variantId
      );
      if (existingItemIndex > -1) {
        const updatedCart = [...state.cart];
        updatedCart[existingItemIndex].quantity += 1;
        return { ...state, cart: updatedCart };
      }
      return {
        ...state,
        cart: [
          ...state.cart,
          {
            id: product.variantId, // Unique ID for cart management
            productId: product.productId,
            variantId: product.variantId,
            barcode: product.barcode,
            name: product.name,
            size: product.size,
            quantity: 1,
            price: price,
            discount: 0,
          },
        ],
      };
    }
    case "REMOVE_ITEM":
      return {
        ...state,
        cart: state.cart.filter((item) => item.id !== action.payload),
      };
    case "UPDATE_ITEM":
      return {
        ...state,
        cart: state.cart.map((item) =>
          item.id === action.payload.id ? { ...item, ...action.payload } : item
        ),
      };
    case "SET_CUSTOMER":
      return { ...state, customer: action.payload };
    case "TOGGLE_WHOLESALE": {
      const { isWholesale, products } = action.payload;
      const updatedCart = state.cart.map((item) => {
        const product = products.find((p) => p.variantId === item.variantId);
        if (!product) return item;
        return {
          ...item,
          price: isWholesale ? product.wholesalePrice : product.retailPrice,
        };
      });
      return {
        ...state,
        isWholesale,
        cart: updatedCart,
      };
    }
    case "CLEAR_CART":
      return { ...state, customer: null, cart: [], isWholesale: false };
    case "RESUME_SALE": {
      const { cart, customer, isWholesale } = action.payload;
      return {
        ...state,
        cart,
        customer,
        isWholesale: isWholesale || false,
      };
    }
    default:
      return state;
  }
}

// --- UI Sub-components ---
const CustomerSelector = ({
  customers,
  selectedCustomer,
  onSelectCustomer,
  onCustomerCreated,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateFields, setShowCreateFields] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const { data: session } = useSession();

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.phone && c.phone.includes(searchTerm))
  );

  const handleCreateCustomer = async () => {
    if (!newCustomerName.trim()) {
      toast.error("Customer name is required");
      return;
    }
    if (!session?.accessToken) {
      toast.error("Please log in to create a customer");
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/customers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({
          name: newCustomerName.trim(),
          phone: newCustomerPhone.trim() || null,
        }),
      });

      const result = await response.json();
      if (result.status === "success") {
        toast.success("Customer created successfully");
        onCustomerCreated(result.data);
        onSelectCustomer(result.data);
        setNewCustomerName("");
        setNewCustomerPhone("");
        setSearchTerm("");
        setShowCreateFields(false);
        setIsOpen(false);
      } else {
        toast.error(result.message || "Failed to create customer");
      }
    } catch (error) {
      console.error("Error creating customer:", error);
      toast.error("An error occurred while creating customer");
    } finally {
      setIsCreating(false);
    }
  };

  const openCreateForm = (initialName = "") => {
    setNewCustomerName(initialName);
    setShowCreateFields(true);
    setIsOpen(true);
  };

  return (
    <div className="relative flex gap-2">
      <Button
        variant="outline"
        className="h-11 flex-1 justify-start gap-3 text-left bg-white"
        onClick={() => {
          setIsOpen(!isOpen);
          setShowCreateFields(false);
        }}
      >
        <Users className="h-5 w-5 text-slate-400" />
        <div className="flex-1">
          <p className="font-semibold text-slate-800 truncate text-sm">
            {selectedCustomer ? selectedCustomer.name : "Walk-in Customer"}
          </p>
          <p className="text-xs text-slate-500">
            {selectedCustomer
              ? selectedCustomer.phone
              : "Select a customer profile"}
          </p>
        </div>
      </Button>
      <Button
        variant="outline"
        size="icon"
        className="h-11 w-11 bg-white text-blue-600 hover:bg-blue-50 hover:text-blue-700"
        onClick={() => {
          openCreateForm("");
        }}
        title="Add New Customer"
      >
        <Plus className="h-5 w-5" />
      </Button>
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-xl z-20 p-2 min-w-[280px]">
          {!showCreateFields ? (
            <>
              <Input
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mb-2"
                autoFocus
              />
              <div className="max-h-60 overflow-y-auto mb-2">
                {filteredCustomers.length > 0 ? (
                  filteredCustomers.map((customer) => (
                    <Button
                      key={customer.id}
                      variant="ghost"
                      className="w-full justify-start h-auto py-2 px-3 hover:bg-slate-100"
                      onClick={() => {
                        onSelectCustomer(customer);
                        setIsOpen(false);
                        setSearchTerm("");
                      }}
                    >
                      <div className="text-left">
                        <p className="font-medium text-sm">{customer.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {customer.phone || "No phone"}
                        </p>
                      </div>
                    </Button>
                  ))
                ) : (
                  <div className="py-4 px-2 text-center">
                    <p className="text-sm text-slate-500 mb-3">No customers found</p>
                    {searchTerm.trim() !== "" && (
                      <Button 
                        variant="soft" 
                        size="sm" 
                        className="w-full bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200"
                        onClick={() => openCreateForm(searchTerm)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create "{searchTerm}"
                      </Button>
                    )}
                  </div>
                )}
              </div>
              {filteredCustomers.length > 0 && (
                 <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full text-blue-600 hover:text-blue-700 hover:bg-blue-50 text-xs py-1"
                    onClick={() => openCreateForm(searchTerm)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    New Customer
                  </Button>
              )}
            </>
          ) : (
            <div className="space-y-3 p-2 bg-blue-50/50 rounded-lg border border-blue-100">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-blue-700 uppercase">New Customer</p>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 text-slate-400 hover:text-slate-600"
                  onClick={() => setShowCreateFields(false)}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-2">
                <Input
                  placeholder="Customer Name *"
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  className="h-9 text-sm bg-white"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreateCustomer();
                  }}
                  autoFocus
                />
                <Input
                  placeholder="Phone Number (Optional)"
                  value={newCustomerPhone}
                  onChange={(e) => setNewCustomerPhone(e.target.value)}
                  className="h-9 text-sm bg-white"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreateCustomer();
                  }}
                />
                <Button
                  size="sm"
                  className="w-full h-9 bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={handleCreateCustomer}
                  disabled={isCreating}
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Customer
                    </>
                  )}
                </Button>
              </div>
              <p className="text-[10px] text-slate-500 italic text-center">
                Full profile can be added in Customers dashboard
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};


const ProductCardWithImage = ({ product, onAddToCart }) => (
  <Card
    onClick={() => onAddToCart(product)}
    className="cursor-pointer group border-slate-200/80 hover:border-blue-400/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 h-full flex flex-col overflow-hidden"
  >
    <CardContent className="p-0 flex-1 flex flex-col">
      <div className="overflow-hidden">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-32 object-cover rounded-t-lg group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="h-32 flex items-center justify-center bg-slate-100 rounded-t-lg">
            <ImageIcon className="h-8 w-8 text-slate-400" />
          </div>
        )}
      </div>
      <div className="p-3 flex-1 flex flex-col bg-white">
        <div className="flex justify-between items-start mb-1">
          <p className="font-semibold text-sm text-slate-800 flex-1">
            {product.name}
          </p>
          {product.size && (
            <Badge
              variant="secondary"
              className="ml-2 shrink-0 text-xs bg-blue-50 text-blue-700 border border-blue-200"
            >
              {product.size}
            </Badge>
          )}
        </div>
        <div className="mt-auto pt-2">
          <p className="text-blue-600 font-bold">
            LKR {product.retailPrice.toFixed(2)}
          </p>
        </div>
      </div>
    </CardContent>
  </Card>
);
const ProductCardSimple = ({ product, onAddToCart }) => (
  <button
    onClick={() => onAddToCart(product)}
    className="w-full text-left p-3 border border-slate-200/80 bg-white rounded-lg hover:border-blue-400 hover:bg-blue-50/50 transition-colors flex justify-between items-center group"
  >
    <div>
      <p className="font-semibold text-sm text-slate-800 group-hover:text-blue-800">
        {product.name}
      </p>
      <p className="text-xs text-slate-500">{product.size}</p>
    </div>
    <div className="text-right">
      <p className="font-bold text-sm text-blue-600">
        LKR {product.retailPrice.toFixed(2)}
      </p>
    </div>
  </button>
);
const CartItemCard = forwardRef(
  ({ item, dispatch, isSelected, onEnterPress }, ref) => {
    const netTotal = item.price * item.quantity * (1 - item.discount / 100);
    const handleQuantityChange = (newQuantity) => {
      const quantity = Math.max(0, newQuantity);
      if (quantity === 0) dispatch({ type: "REMOVE_ITEM", payload: item.id });
      else
        dispatch({ type: "UPDATE_ITEM", payload: { id: item.id, quantity } });
    };
    const handleDiscountChange = (newDiscount) => {
      const discount = Math.max(0, Math.min(100, newDiscount));
      dispatch({ type: "UPDATE_ITEM", payload: { id: item.id, discount } });
    };
    const handleKeyDown = (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        onEnterPress();
      }
    };
    return (
      <div
        className={clsx(
          "group flex items-center gap-x-4 p-2 rounded-lg border-2 transition-all duration-200",
          isSelected
            ? "bg-blue-50 border-blue-500 shadow-md"
            : "bg-white border-transparent hover:border-slate-200"
        )}
      >
        {/* Product Info */}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-slate-800 truncate">{item.name}</p>
          <p className="text-xs text-slate-500">
            {item.barcode} {item.size && `• ${item.size}`}
          </p>
        </div>

        {/* Price */}
        <div className="w-24 shrink-0 text-right">
          <label className="text-xs text-slate-500 block">Price</label>
          <p className="font-medium text-sm text-slate-700">
            {item.price.toFixed(2)}
          </p>
        </div>

        {/* Quantity */}
        <div className="flex shrink-0 items-center gap-1.5 w-[120px]">
          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8 bg-white shrink-0"
            onClick={() => handleQuantityChange(item.quantity - 1)}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <Input
            ref={ref}
            onKeyDown={handleKeyDown}
            type="number"
            value={item.quantity}
            onChange={(e) => handleQuantityChange(Number(e.target.value))}
            className="h-8 w-full min-w-0 text-center text-base font-semibold p-0 bg-white"
          />
          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8 bg-white shrink-0"
            onClick={() => handleQuantityChange(item.quantity + 1)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Discount */}
        <div className="w-24 shrink-0">
          <label className="text-xs text-slate-500 block text-center">
            Discount
          </label>
          <div className="relative">
            <Input
              type="number"
              value={item.discount}
              onChange={(e) => handleDiscountChange(Number(e.target.value))}
              className="h-8 w-full text-center text-sm p-1 bg-white pr-5"
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">
              %
            </span>
          </div>
        </div>

        {/* Amount */}
        <div className="w-32 shrink-0 text-right">
          <label className="text-xs text-slate-500 block">Amount</label>
          <p className="font-bold text-lg text-blue-700">
            {netTotal.toFixed(2)}
          </p>
        </div>

        {/* Delete Button */}
        <div className="w-8 shrink-0">
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-red-500/70 hover:text-red-600 hover:bg-red-100 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
            onClick={() => dispatch({ type: "REMOVE_ITEM", payload: item.id })}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }
);
CartItemCard.displayName = "CartItemCard";
const CalculatorModal = ({ onClose }) => {
  const [displayValue, setDisplayValue] = useState("0");
  const [operator, setOperator] = useState(null);
  const [previousValue, setPreviousValue] = useState(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const handleNumberClick = (num) => {
    if (waitingForOperand) {
      setDisplayValue(String(num));
      setWaitingForOperand(false);
    } else {
      setDisplayValue(displayValue === "0" ? String(num) : displayValue + num);
    }
  };
  const handleOperatorClick = (op) => {
    const inputValue = parseFloat(displayValue);
    if (previousValue === null) {
      setPreviousValue(inputValue);
    } else if (operator) {
      const result = performCalculation();
      setPreviousValue(result);
      setDisplayValue(String(result));
    }
    setWaitingForOperand(true);
    setOperator(op);
  };
  const performCalculation = () => {
    const inputValue = parseFloat(displayValue);
    if (operator === "+") return previousValue + inputValue;
    if (operator === "-") return previousValue - inputValue;
    if (operator === "*") return previousValue * inputValue;
    if (operator === "/") return previousValue / inputValue;
    return inputValue;
  };
  const handleEqualsClick = () => {
    if (!operator) return;
    const result = performCalculation();
    setDisplayValue(String(result));
    setPreviousValue(null);
    setOperator(null);
    setWaitingForOperand(false);
  };
  const handleClearClick = () => {
    setDisplayValue("0");
    setPreviousValue(null);
    setOperator(null);
    setWaitingForOperand(false);
  };
  const handleDecimalClick = () => {
    if (!displayValue.includes(".")) setDisplayValue(displayValue + ".");
  };
  const calcButtons = [
    "7",
    "8",
    "9",
    "/",
    "4",
    "5",
    "6",
    "*",
    "1",
    "2",
    "3",
    "-",
    "0",
    ".",
    "=",
    "+",
  ];
  const handleButtonClick = (btn) => {
    if (!isNaN(parseInt(btn))) handleNumberClick(btn);
    else if (["/", "*", "-", "+"].includes(btn)) handleOperatorClick(btn);
    else if (btn === "=") handleEqualsClick();
    else if (btn === ".") handleDecimalClick();
  };
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-80"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="font-bold text-slate-800">Calculator</h3>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="p-4">
          <div className="bg-slate-100 text-right text-4xl font-mono p-4 rounded-lg mb-4 break-all">
            {displayValue}
          </div>
          <div className="grid grid-cols-4 gap-2">
            <Button
              onClick={handleClearClick}
              className="col-span-4 h-14 text-xl bg-amber-500 hover:bg-amber-600"
            >
              C
            </Button>
            {calcButtons.map((btn) => (
              <Button
                key={btn}
                onClick={() => handleButtonClick(btn)}
                variant={
                  isNaN(parseInt(btn)) && btn !== "." ? "secondary" : "outline"
                }
                className="h-14 text-xl"
              >
                {btn}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
// --- Main POS Page Component ---
export default function PosPage() {
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [activeEmployees, setActiveEmployees] = useState([]);
  const [editMode, setEditMode] = useState("search");
  const [selectedCartIndex, setSelectedCartIndex] = useState(0);
  const [showProductImages, setShowProductImages] = useState(true);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isReturnDialogOpen, setIsReturnDialogOpen] = useState(false);
  const [selectedReturnSale, setSelectedReturnSale] = useState(null);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [adjustment, setAdjustment] = useState(0);
  const [cashIn, setCashIn] = useState(0);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState([]);
  const [wholesaleDiscount, setWholesaleDiscount] = useState(0);
  const [generalDiscount, setGeneralDiscount] = useState(0);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [chequeDetails, setChequeDetails] = useState({ bank_name: "", cheque_number: "", cheque_date: "", payee_payor_name: "" });
  const [isHoldListOpen, setIsHoldListOpen] = useState(false);
  const [isSaleListOpen, setIsSaleListOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [salesData, setSalesData] = useState([]); // Shared or separate
  const [isLoadingSales, setIsLoadingSales] = useState(false);
  const [stockData, setStockData] = useState([]);
  const [isLoadingStock, setIsLoadingStock] = useState(false);
  const [stockSearch, setStockSearch] = useState("");
  const debouncedStockSearch = useDebounce(stockSearch, 500);
  const [recentSales, setRecentSales] = useState([]);
  const [isLoadingRecentSales, setIsLoadingRecentSales] = useState(false);
  const [selectedSaleDetail, setSelectedSaleDetail] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const debouncedProductSearch = useDebounce(productSearch, 300);

  const PAYMENT_METHODS_MAP = [
    { id: "cash", label: "Cash", icon: Banknote, color: "text-emerald-500" },
    { id: "card", label: "Card", icon: CreditCard, color: "text-blue-500" },
    { id: "online", label: "Online", icon: Globe, color: "text-purple-500" },
    { id: "qr", label: "QR Pay", icon: QrCode, color: "text-cyan-500" },
    { id: "wallet", label: "Wallet", icon: Smartphone, color: "text-pink-500" },
    { id: "voucher", label: "Voucher", icon: Tag, color: "text-orange-500" },
    { id: "cheque", label: "Cheque", icon: Landmark, color: "text-amber-500" },
  ];

  const searchInputRef = useRef(null);
  const cartItemRefs = useRef(new Map());
  const initialState = { cart: [], customer: null, isWholesale: false };
  const [state, dispatch] = useReducer(appReducer, initialState);
  const { data: session } = useSession();
  const router = useRouter();
  const { receipt: receiptSettings, setReceiptSettings, business: localBusiness, setBusinessSettings } = useSettingsStore();
  const { useBusinessSettings, useModularSettings } = useSettings();
  const { data: businessResponse } = useBusinessSettings();
  const { data: receiptResponse } = useModularSettings('receipt');
  const { data: posResponse } = useModularSettings('pos');
  const { playBeep } = useBeep();

  const printRef = useRef(null);
  const [printableSale, setPrintableSale] = useState(null);

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `Receipt_${printableSale?.invoice_number || "Draft"}`,
    onAfterPrint: () => setPrintableSale(null),
  });

  useEffect(() => {
    if (printableSale) {
      console.log("Printing sale:", printableSale.invoice_number);
      // Small delay to ensure DOM is rendered
      const timer = setTimeout(() => {
        if (printRef.current) {
          handlePrint();
        } else {
          console.error("Print ref is null, cannot print");
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [printableSale, handlePrint]);

  useEffect(() => {
    if (businessResponse?.data) setBusinessSettings(businessResponse.data);
    if (receiptResponse?.data) setReceiptSettings(receiptResponse.data);
  }, [businessResponse, receiptResponse]);

  // Helper for image URLs
  const getImageUrl = (imageField) => {
    if (!imageField) return null;
    try {
      const images = JSON.parse(imageField);
      if (Array.isArray(images) && images.length > 0) {
        const path = images[0];
        if (path.startsWith("http")) return path;
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL.replace("/api/v1", "");
        return `${baseUrl}/${encodeURI(path.replace(/\\/g, "/"))}`;
      }
    } catch (e) {
      if (typeof imageField === "string" && imageField.startsWith("http")) return imageField;
      if (typeof imageField === "string" && imageField.length > 0) {
          const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL.replace("/api/v1", "");
          return `${baseUrl}/${encodeURI(imageField.replace(/\\/g, "/"))}`;
      }
    }
    return null;
  };

  // Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      if (!session?.accessToken) return;
      try {
        // 1. Fetch Products
        const prodRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/products?size=1000`, {
          headers: { Authorization: `Bearer ${session.accessToken}` }
        });
        const prodResult = await prodRes.json();
        if (prodResult.status === "success") {
          const productList = prodResult.data.data || [];
          // Flatten products to variants
          const flattened = [];
          productList.forEach(p => {
            if (p.variants && p.variants.length > 0) {
              p.variants.forEach(v => {
                // Construct variant label
                let variantLabel = v.name;
                if (!variantLabel && v.attribute_values && v.attribute_values.length > 0) {
                  variantLabel = v.attribute_values.map(av => av.value).join(" / ");
                }

                flattened.push({
                  productId: p.id,
                  variantId: v.id,
                  barcode: v.barcode || p.barcode,
                  name: variantLabel ? `${p.name} - ${variantLabel}` : p.name,
                  size: variantLabel || "Default",
                  retailPrice: parseFloat(v.price) || 0,
                  wholesalePrice: parseFloat(v.wholesale_price) || 0,
                  imageUrl: getImageUrl(v.image) || getImageUrl(p.image) || "https://images.unsplash.com/photo-1579992308814-569b01534026?q=80&w=2592&auto=format&fit=crop"
                });
              });
            }
          });
          setProducts(flattened);
        }

        // 2. Fetch Customers
        const custRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/customers/active/list`, {
          headers: { Authorization: `Bearer ${session.accessToken}` }
        });
        const custResult = await custRes.json();
        if (custResult.status === "success") {
          setCustomers(custResult.data);
        }

        // 3. Fetch Active Sellers
        const sellerRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/users/active-sellers`, {
          headers: { Authorization: `Bearer ${session.accessToken}` }
        });
        const sellerResult = await sellerRes.json();
        if (sellerResult.status === "success") {
          setActiveEmployees(sellerResult.data);
          if (session?.user?.id) {
             setSelectedEmployeeIds([session.user.id]);
          } else if (sellerResult.data.length > 0) {
             setSelectedEmployeeIds([sellerResult.data[0].id]);
          }
        }
      } catch (error) {
        console.error("Error fetching POS data:", error);
        toast.error("Failed to load POS data");
      }
    };

    fetchData();
    fetchRecentSales();
    searchInputRef.current?.focus();

    // Set initial branch
    if (session?.user?.branches?.length > 0) {
      setSelectedBranch(session.user.branches[0]);
    }
  }, [session]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);


  // Auto-scan feature: if search exactly matches a barcode, add to cart
  useEffect(() => {
    if (productSearch && productSearch.length >= 3) {
      const match = products.find(p => p.barcode === productSearch);
      if (match) {
        handleAddToCart(match);
        setProductSearch("");
        toast.success(`Scanned: ${match.name}`);
      }
    }
  }, [productSearch, products]);

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(debouncedProductSearch.toLowerCase()) ||
    (p.barcode && p.barcode.includes(debouncedProductSearch))
  );
  const totals = state.cart.reduce(
    (acc, item) => {
      const grossTotal = item.price * item.quantity;
      const itemDiscountAmount = grossTotal * (item.discount / 100);
      acc.subtotal += grossTotal;
      acc.totalItemDiscount += itemDiscountAmount;
      return acc;
    },
    { subtotal: 0, totalItemDiscount: 0 }
  );

  const wholesaleDiscountAmount = state.isWholesale
    ? totals.subtotal * (wholesaleDiscount / 100)
    : 0;
  const generalDiscountAmount = totals.subtotal * (generalDiscount / 100);
  const totalDiscount = totals.totalItemDiscount + wholesaleDiscountAmount + generalDiscountAmount;
  const subtotalAfterDiscounts = totals.subtotal - totalDiscount;
  // Tax is now calculated by backend based on settings
  const grandTotal = subtotalAfterDiscounts;
  const netTotal = grandTotal + adjustment;
  const balance = cashIn > 0 ? cashIn - netTotal : 0;

  // Validation: Walk-in customers must pay in full
  const isWalkIn = !state.customer;
  const isPartialPayment = cashIn < netTotal && cashIn > 0;
  const showWalkInWarning = isWalkIn && isPartialPayment;

  const handlePayNow = async () => {
    if (showWalkInWarning) {
      toast.error("Walk-in customers must pay the full amount.");
      return;
    }
    if (state.cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }
    if (!session?.accessToken) {
      toast.error("Please log in to complete the sale");
      return;
    }

    try {
      const saleData = {
        branch_id: selectedBranch?.id,
        customer_id: state.customer?.id,
        items: state.cart.map((item) => ({
          product_id: item.productId,
          product_variant_id: item.variantId,
          quantity: item.quantity,
          unit_price: item.price,
          discount_amount: item.price * item.quantity * (item.discount / 100),
          // tax_amount removed - backend calculates based on settings
        })),
        total_amount: totals.subtotal,
        discount_amount: totalDiscount,
        // tax_amount removed - backend calculates based on settings
        payable_amount: grandTotal,
        paid_amount: cashIn,
        payment_method: paymentMethod.toLowerCase(),
        cheque_details: paymentMethod === "Cheque" ? chequeDetails : null,
        notes: "",
        adjustment: adjustment,
        seller_ids: selectedEmployeeIds,
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/sales`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify(saleData),
      });

      const result = await response.json();
      if (result.status === "success") {
        // Handle Auto-Print (Default to TRUE if not explicitly FALSE)
        console.log("Sale Success Content:", result.data);
        console.log("AutoPrint Setting:", receiptSettings.autoPrintReceipt);
        
        if (receiptSettings.autoPrintReceipt !== false) {
            console.log("Triggering auto-print...");
            setPrintableSale(result.data);
        } else {
            console.log("Auto-print is disabled in settings");
        }
        
        // Only show toast if sound is disabled or we want extra feedback
        toast.success("Sale completed successfully");
        playBeep('success');
        dispatch({ type: "CLEAR_CART" });
        setPaymentMethod("Cash");
        setCashIn(0);
        setAdjustment(0);
        setGeneralDiscount(0);
        setWholesaleDiscount(0);
        fetchRecentSales(); // Refresh recent sales after successful sale
      } else {
        toast.error(result.message || "Failed to complete sale");
        playBeep('error');
      }
    } catch (error) {
      console.error("Error completing sale:", error);
      toast.error(error.message || "Payment failed");
      playBeep('error');
    }
  };

  const handleHoldSale = async () => {
    if (state.cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }
    if (!session?.accessToken) {
      toast.error("Please log in to hold the sale");
      return;
    }

    try {
      const saleData = {
        status: "draft",
        branch_id: selectedBranch?.id,
        customer_id: state.customer?.id,
        seller_ids: selectedEmployeeIds,
        items: state.cart.map((item) => ({
          product_id: item.productId,
          product_variant_id: item.variantId,
          quantity: item.quantity,
          unit_price: item.price,
          discount_amount: item.price * item.quantity * (item.discount / 100),
          // tax_amount removed - backend calculates based on settings
        })),
        total_amount: totals.subtotal,
        discount_amount: totalDiscount,
        // tax_amount removed - backend calculates based on settings
        payable_amount: grandTotal,
        paid_amount: 0,
        payment_method: "Other",
        notes: "Held Sale",
        adjustment: adjustment,
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/sales`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify(saleData),
      });

      const result = await response.json();
      if (result.status === "success") {
        toast.success("Sale held successfully");
        playBeep('success');
        resetSale();
      } else {
        toast.error(result.message || "Failed to hold sale");
        playBeep('error');
      }
    } catch (error) {
      console.error("Error holding sale:", error);
      toast.error("An error occurred while holding sale");
      playBeep('error');
    }
  };

  const fetchRecentSales = async () => {
    if (!session?.accessToken) return;
    setIsLoadingRecentSales(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/sales?status=completed&size=10`, {
        headers: { Authorization: `Bearer ${session.accessToken}` }
      });
      const result = await res.json();
      if (result.status === "success") {
        setRecentSales(result.data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch recent sales:", error);
    } finally {
      setIsLoadingRecentSales(false);
    }
  };

  const fetchSales = async (status) => {
    if (!session?.accessToken) return;
    setIsLoadingSales(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/sales?status=${status}&size=50`, {
        headers: { Authorization: `Bearer ${session.accessToken}` }
      });
      const result = await res.json();
      if (result.status === "success") {
        setSalesData(result.data.data || []);
      }
    } catch (error) {
      toast.error("Failed to fetch sales");
    } finally {
      setIsLoadingSales(false);
    }
  };

  const deleteSale = async (id) => {
    if (!session?.accessToken) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/sales/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session.accessToken}` }
      });
      const result = await res.json();
      if (result.status === "success") {
        toast.success("Sale deleted");
        return true;
      }
    } catch (error) {
      toast.error("Failed to delete sale");
    }
    return false;
  };

  const resumeSale = (sale) => {
    if (!sale.items || sale.items.length === 0) {
      toast.error("This sale has no items");
      return;
    }

    // 1. Map sale items to cart items
    const restoredCart = sale.items.map(item => {
      // Find the product in our local flattened list
      const prod = products.find(p => 
        (item.product_variant_id && p.variantId === item.product_variant_id) || 
        (!item.product_variant_id && p.productId === item.product_id)
      );

      if (prod) {
        return {
          id: prod.variantId || prod.productId,
          productId: prod.productId,
          variantId: prod.variantId,
          barcode: prod.barcode,
          name: prod.name,
          size: prod.size,
          quantity: parseFloat(item.quantity) || 1,
          price: parseFloat(item.unit_price) || prod.retailPrice,
          discount: 0, // Simplified for now
        };
      }
      return null;
    }).filter(Boolean);

    if (restoredCart.length === 0) {
      toast.error("Could not match any products from this sale");
      return;
    }

    // 2. Find customer
    const restoredCustomer = customers.find(c => c.id === sale.customer_id) || null;

    // 3. Dispatch atomic update
    dispatch({ 
      type: "RESUME_SALE", 
      payload: { 
        cart: restoredCart, 
        customer: restoredCustomer,
        isWholesale: sale.status === 'draft' && parseFloat(sale.payable_amount) < parseFloat(sale.total_amount)
      } 
    });

    // 4. Delete the draft from backend
    deleteSale(sale.id);
    
    // 5. Close modal
    setIsHoldListOpen(false);
    toast.success(`Resumed sale ${sale.invoice_number}`);
  };

  const handleCheckStock = async (query) => {
    if (!query || query.length < 2) return;
    if (!session?.accessToken) return;
    
    setIsLoadingStock(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/products/stock/check?search=${encodeURIComponent(query)}`, {
        headers: { Authorization: `Bearer ${session.accessToken}` }
      });
      const result = await res.json();
      if (result.status === "success") {
        setStockData(result.data || []);
      }
    } catch (error) {
      toast.error("Failed to fetch stock info");
    } finally {
      setIsLoadingStock(false);
    }
  };

  // Effect for debounced stock search
  useEffect(() => {
    if (debouncedStockSearch && debouncedStockSearch.length >= 2) {
      handleCheckStock(debouncedStockSearch);
    } else if (!debouncedStockSearch) {
      setStockData([]);
    }
  }, [debouncedStockSearch]);

  const handleAddToCart = (product) => {
    const existingItemIndex = state.cart.findIndex(
      (item) => item.variantId === product.variantId
    );

    if (existingItemIndex > -1) {
      setSelectedCartIndex(existingItemIndex);
      const existingItem = state.cart[existingItemIndex];
      const itemRef = cartItemRefs.current.get(existingItem.variantId);
      if (itemRef) {
        itemRef.focus();
        itemRef.select();
        itemRef
          .closest(".group")
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      setEditMode("cart");
    }

    dispatch({ type: "ADD_ITEM", payload: { product } });
    playBeep('success');
    setProductSearch("");
  };

  const handleSelectCustomer = (customer) => {
    dispatch({ type: "SET_CUSTOMER", payload: customer });
  };

  const handleLivePreview = () => {
    const mockSale = {
      invoice_number: "PREVIEW",
      created_at: new Date().toISOString(),
      customer_id: state.customer?.id,
      customer_name: state.customer?.name || "Guest Customer",
      items: state.cart.map(item => ({
        product_name: item.name,
        quantity: item.quantity,
        unit_price: item.price,
        total_amount: (item.price * item.quantity),
        product_variant_id: item.variantId,
        // Add structure that ReceiptTemplate expects
        product: { name: item.name },
        product_variant: item.variantId ? { name: item.variantName } : null
      })),
      total_amount: totals.subtotal,
      discount_amount: totalDiscount,
      payable_amount: grandTotal,
      paid_amount: cashIn,
      payment_method: paymentMethod,
      adjustment: adjustment,
      status: 'preview'
    };
    setPrintableSale(mockSale);
    playBeep('subtle');
  };

  const resetSale = () => {
    dispatch({ type: "CLEAR_CART" });
    setAdjustment(0);
    setCashIn(0);
    setWholesaleDiscount(0);
    setGeneralDiscount(0);
    searchInputRef.current?.focus();
    setEditMode("search");
  };
  const focusOnSearch = () => {
    setEditMode("search");
    searchInputRef.current?.focus();
    searchInputRef.current?.select();
  };
  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  };

  const handleWholesaleToggle = () => {
    const nextIsWholesale = !state.isWholesale;
    dispatch({
      type: "TOGGLE_WHOLESALE",
      payload: { isWholesale: nextIsWholesale, products },
    });
    if (!nextIsWholesale) {
      setWholesaleDiscount(0);
    }
  };

  useEffect(() => {
    const handleFullScreenChange = () =>
      setIsFullScreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFullScreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullScreenChange);
  }, []);
  useEffect(() => {
    // This effect runs ONLY when a NEW item is added (cart length changes)
    if (state.cart.length > 0) {
      const lastItem = state.cart[state.cart.length - 1];
      const lastItemRef = cartItemRefs.current.get(lastItem.id);
      if (lastItemRef && document.activeElement !== searchInputRef.current) {
        lastItemRef.focus();
        lastItemRef.select();
        setEditMode("cart");
        setSelectedCartIndex(state.cart.length - 1);
      }
    }
  }, [state.cart.length]);
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.key === "q" || e.key === "Q") && (e.ctrlKey || !e.metaKey)) {
        e.preventDefault();
        focusOnSearch();
      }
      if (e.key === "Escape") {
        e.preventDefault();
        if (isCalculatorOpen) setIsCalculatorOpen(false);
        else if (isSaleListOpen) setIsSaleListOpen(false); // Changed from isReprintModalOpen
        else if (state.cart.length > 0) {
          setEditMode("cart");
          setSelectedCartIndex(0);
          cartItemRefs.current.get(state.cart[0].id)?.focus();
        }
      }
      if (editMode === "cart" && state.cart.length > 0) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          const nextIndex = Math.min(
            state.cart.length - 1,
            selectedCartIndex + 1
          );
          setSelectedCartIndex(nextIndex);
          cartItemRefs.current.get(state.cart[nextIndex].id)?.focus();
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          const prevIndex = Math.max(0, selectedCartIndex - 1);
          setSelectedCartIndex(prevIndex);
          cartItemRefs.current.get(state.cart[prevIndex].id)?.focus();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    editMode,
    selectedCartIndex,
    state.cart,
    focusOnSearch,
    isCalculatorOpen,
    isSaleListOpen, // Changed from isReprintModalOpen
  ]);

  const utilityActions = [
    {
      label: "Hold Sale",
      icon: ListRestart,
      action: handleHoldSale,
    },
    {
      label: "Hold List",
      icon: Archive,
      action: () => {
        setIsHoldListOpen(true);
        fetchSales("draft");
      },
    },
    {
      label: "Sale List",
      icon: List,
      action: () => {
        setIsSaleListOpen(true);
        fetchSales("completed");
      },
    },
    {
      label: "Check Stock",
      icon: PackageSearch,
      action: () => {
        setIsStockModalOpen(true);
        setStockData([]);
        setStockSearch("");
      },
    },
    {
      label: "Reprint",
      icon: Printer,
      action: () => setIsReprintModalOpen(true),
    },
    {
      label: "Return",
      icon: Undo,
      action: () => alert("Open Return Interface (placeholder)"),
    },
    {
      label: "Branch Item",
      icon: FlaskConical,
      action: () => alert("Branch Item Action (placeholder)"),
    },
    {
      label: "Transfer",
      icon: ArrowLeftRight,
      action: () => {},
      disabled: true,
    },
    { label: "Change Price", icon: Tag, action: () => {}, disabled: true },
  ];

  return (
    <>
      <div className="flex h-screen flex-col items-center justify-center bg-slate-100 p-4 text-center lg:hidden">
        <MonitorX className="h-16 w-16 text-slate-400" />
        <h1 className="mt-6 text-2xl font-bold text-slate-800">
          Optimal Experience on Larger Screens
        </h1>
        <p className="mt-2 max-w-sm text-slate-600">
          This POS system is designed for tablets and desktops. Please switch to
          a larger device to continue.
        </p>
      </div>

      <div className="hidden h-screen flex-col bg-slate-50 font-sans lg:flex">
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          <ResizablePanelGroup
            direction="horizontal"
            className="flex-1 lg:flex"
          >
            <ResizablePanel defaultSize={35} minSize={30}>
              <aside className="flex flex-col h-full border-r border-slate-200/60 bg-white">
                <header className="p-4 border-b border-slate-200/60">
                  <div className="space-y-3 ">
                    <div className="relative w-full flex gap-3 items-center justify-start">
                      <Button type="button" variant="outline" className="h-12" onClick={() => router.back()}>
                        <ArrowLeft />
                        Back
                      </Button>
                      <Search className="absolute left-26 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <Input
                        ref={searchInputRef}
                        placeholder="Search products... (Ctrl+Q)"
                        className="pl-11 h-12 text-base bg-white border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        onFocus={() => setEditMode("search")}
                      />
                    </div>
                    {session?.user?.branches?.length > 1 && (
                      <div className="flex items-center gap-2">
                        <Store className="h-4 w-4 text-slate-500" />
                        <Select
                          value={selectedBranch?.id}
                          onValueChange={(id) => {
                            const branch = session.user.branches.find(b => b.id === id);
                            setSelectedBranch(branch);
                          }}
                        >
                          <SelectTrigger className="h-9 w-full bg-white">
                            <SelectValue placeholder="Select Branch" />
                          </SelectTrigger>
                          <SelectContent>
                            {session.user.branches.map((b) => (
                              <SelectItem key={b.id} value={b.id}>
                                {b.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2">
                      <CustomerSelector
                        customers={customers}
                        selectedCustomer={state.customer}
                        onSelectCustomer={handleSelectCustomer}
                        onCustomerCreated={(newCustomer) => setCustomers(prev => [...prev, newCustomer])}
                      />
                      <Button
                        variant="outline"
                        className="h-11 bg-white"
                        onClick={() => setShowProductImages(!showProductImages)}
                        title={
                          showProductImages
                            ? "Switch to list view"
                            : "Switch to grid view"
                        }
                      >
                        {showProductImages ? (
                          <List className="h-5 w-5" />
                        ) : (
                          <ImageIcon className="h-5 w-5" />
                        )}
                      </Button>
                    </div>
                  </div>
                </header>
                <div className="flex-1 p-4 overflow-y-auto bg-slate-50/50">
                  {showProductImages ? (
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4">
                      {filteredProducts.map((p) => (
                        <ProductCardWithImage
                          key={p.id}
                          product={p}
                          onAddToCart={handleAddToCart}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {filteredProducts.map((p) => (
                        <ProductCardSimple
                          key={p.id}
                          product={p}
                          onAddToCart={handleAddToCart}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </aside>
            </ResizablePanel>
            <ResizableHandle
              withHandle
              className="bg-slate-100 hidden lg:flex"
            />
            <ResizablePanel defaultSize={65} minSize={40}>
              <div className="flex flex-col h-full overflow-hidden">
                <div className="flex-1 overflow-hidden">
                  <ResizablePanelGroup direction="vertical">
                <ResizablePanel defaultSize={70} minSize={30}>
                  <main className="flex flex-col h-full overflow-hidden">
                    <header className="p-4 border-b border-slate-200/60 bg-white/80 backdrop-blur-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <ShoppingCart className="h-6 w-6 text-blue-600" />
                          <div>
                            <h2 className="text-xl font-bold text-slate-800">
                              Current Sale
                            </h2>
                            <p className="text-xs text-slate-500 -mt-0.5">
                              {currentDateTime.toLocaleString()}
                            </p>
                          </div>
                          {state.cart.length > 0 && (
                            <Badge
                              variant="secondary"
                              className="px-2.5 py-1 text-sm bg-blue-100 text-blue-800 border-blue-200"
                            >
                              {state.cart.length} items
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-2">
                            <Button
                              variant={state.isWholesale ? "secondary" : "outline"}
                              size="sm"
                              className="h-9 bg-white data-[state=active]:bg-white"
                              onClick={handleWholesaleToggle}
                            >
                              Wholesale
                            </Button>
                            {state.isWholesale && (
                              <div className="relative">
                                <Input
                                  type="number"
                                  placeholder="Discount"
                                  className="h-9 w-28 pl-2 pr-7 text-sm bg-white"
                                  value={wholesaleDiscount || ""}
                                  onChange={(e) =>
                                    setWholesaleDiscount(
                                      Math.max(0, Number(e.target.value))
                                    )
                                  }
                                />
                                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                                  %
                                </span>
                              </div>
                            )}
                          </div>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-9 w-9 bg-white"
                            onClick={() => setIsCalculatorOpen(true)}
                          >
                            <Calculator className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-9 w-9 bg-white"
                            onClick={toggleFullScreen}
                          >
                            {isFullScreen ? (
                              <Minimize className="h-4 w-4" />
                            ) : (
                              <Maximize className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-9 text-red-600 hover:text-red-700 hover:bg-red-50/80 border-red-200/80 bg-white"
                            onClick={resetSale}
                          >
                            <X className="h-4 w-4 mr-1.5" /> Clear
                          </Button>
                        </div>
                      </div>
                    </header>
                    <div className="flex-1 p-4 overflow-y-auto bg-slate-100/60">
                      {state.cart.length > 0 ? (
                        <div className="space-y-2 max-w-full mx-auto">
                          {state.cart.map((item, index) => (
                            <CartItemCard
                              key={item.id}
                              item={item}
                              dispatch={dispatch}
                              isSelected={
                                editMode === "cart" && selectedCartIndex === index
                              }
                              onEnterPress={focusOnSearch}
                              ref={(el) => {
                                if (el) cartItemRefs.current.set(item.variantId, el);
                                else cartItemRefs.current.delete(item.variantId);
                              }}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-500">
                          <ShoppingCart className="h-20 w-20 mb-4 opacity-10" />
                          <p className="text-lg font-medium mb-2">
                            Your cart is empty
                          </p>
                          <p className="text-sm text-center">
                            Add products from the left panel to begin a sale.
                          </p>
                        </div>
                      )}
                    </div>
                  </main>
                </ResizablePanel>
                <ResizableHandle withHandle className="bg-slate-100" />
                <ResizablePanel defaultSize={30} minSize={15}>
                  <section className="h-full flex flex-col bg-white overflow-hidden border-t">
                    <header className="px-4 py-2 border-b bg-slate-50 flex justify-between items-center shrink-0">
                      <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                        <RotateCcw className="h-4 w-4 text-orange-500" />
                        Recent Sales
                      </h3>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 text-xs text-blue-600 hover:text-blue-700"
                        onClick={() => {
                          setIsSaleListOpen(true);
                          fetchSales("completed");
                        }}
                      >
                        View All
                      </Button>
                    </header>
                    <ScrollArea className="flex-1">
                      {isLoadingRecentSales ? (
                        <div className="flex items-center justify-center p-8">
                          <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
                        </div>
                      ) : recentSales.length > 0 ? (
                        <div className="p-2 space-y-1">
                          {recentSales.map((sale) => (
                            <div 
                              key={sale.id}
                              className="group flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 cursor-pointer border border-transparent hover:border-slate-200 transition-all"
                              onClick={() => {
                                setSelectedSaleDetail(sale);
                                setIsDetailOpen(true);
                              }}
                            >
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                                  <List className="h-4 w-4" />
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-slate-800">{sale.invoice_number}</p>
                                  <p className="text-[10px] text-slate-500">{new Date(sale.created_at).toLocaleTimeString()}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="text-right">
                                  <p className="text-xs font-black text-slate-900">LKR {parseFloat(sale.payable_amount).toFixed(2)}</p>
                                  <p className="text-[10px] text-slate-500 uppercase font-bold">{sale.payment_method}</p>
                                </div>
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  className="h-8 w-8 text-slate-400 hover:text-blue-600"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPrintableSale(sale);
                                  }}
                                >
                                  <Printer className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-8 text-center text-slate-400 text-xs italic">
                          No recent sales to display
                        </div>
                      )}
                    </ScrollArea>
                  </section>
                </ResizablePanel>
                  </ResizablePanelGroup>
                </div>
                <footer className="shrink-0 border-t border-slate-200/60 bg-white/80 backdrop-blur-sm p-4 shadow-[0_-5px_15px_-5px_rgba(0,0,0,0.02)]">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 max-w-7xl mx-auto items-start">
                      <div className="lg:col-span-7 flex flex-col gap-3">
                        {/* Top: Utilities & Other Actions */}
                        <div className="grid grid-cols-3 lg:grid-cols-4 gap-2">
                          {utilityActions.map((action) => (
                            <Button
                              key={action.label}
                              variant="outline"
                              className="h-14 flex-col gap-1 text-[10px] bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-800"
                              onClick={action.action}
                              disabled={action.disabled}
                            >
                              <action.icon className="h-4 w-4" />
                              <span className="text-center leading-tight">
                                {action.label}
                              </span>
                            </Button>
                          ))}
                        </div>

                        {/* Combined Payment Methods & Sold By Row */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                          {/* Payment Methods */}
                          {PAYMENT_METHODS_MAP
                            .filter(pm => (posResponse?.data?.activePaymentMethods || ["cash"]).includes(pm.id))
                            .map((pm) => (
                              <Button
                                key={pm.id}
                                variant={paymentMethod.toLowerCase() === pm.id ? "default" : "outline"}
                                className={clsx(
                                  "h-16 flex-col justify-center gap-1 text-[10px] uppercase font-bold tracking-tight bg-white hover:bg-slate-50",
                                  paymentMethod.toLowerCase() === pm.id ? 
                                    (pm.id === 'cash' ? "ring-2 ring-emerald-500 bg-emerald-50 text-emerald-700" :
                                     pm.id === 'card' ? "ring-2 ring-blue-500 bg-blue-50 text-blue-700" :
                                     "ring-2 ring-slate-500 bg-slate-50 text-slate-700") 
                                    : "text-slate-600 hover:text-slate-800"
                                )}
                                onClick={() => {
                                  setPaymentMethod(pm.label);
                                  playBeep('subtle');
                                }}
                              >
                                <pm.icon className={clsx("h-5 w-5", pm.id === 'cash' ? "text-emerald-500" : pm.id === 'card' ? "text-blue-500" : pm.color)} />
                                <span>{pm.label}</span>
                              </Button>
                            ))
                          }
                          
                          {/* Sold By Component - Integrated into the grid */}
                          <div className="h-16">
                            <EmployeeSelector 
                              employees={activeEmployees}
                              selectedEmployees={selectedEmployeeIds}
                              onToggleEmployee={(id) => {
                                  setSelectedEmployeeIds(prev => 
                                      prev.includes(id) 
                                          ? prev.filter(empId => empId !== id)
                                          : [...prev, id]
                                  );
                              }}
                            />
                          </div>
                        </div>

                        {/* Cheque Details (Conditional) */}
                        {paymentMethod === "Cheque" && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-amber-50/50 rounded-lg border border-amber-100">
                             <div className="space-y-1">
                                <label className="text-[10px] font-bold text-amber-700 uppercase">Bank Name</label>
                                <Input 
                                    placeholder="Enter Bank" 
                                    className="h-8 text-xs bg-white border-amber-200"
                                    value={chequeDetails.bank_name}
                                    onChange={(e) => setChequeDetails({...chequeDetails, bank_name: e.target.value})}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-amber-700 uppercase">Cheque #</label>
                                <Input 
                                    placeholder="Enter Cheque #" 
                                    className="h-8 text-xs bg-white border-amber-200"
                                    value={chequeDetails.cheque_number}
                                    onChange={(e) => setChequeDetails({...chequeDetails, cheque_number: e.target.value})}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-amber-700 uppercase">Date</label>
                                <Input 
                                    type="date"
                                    className="h-8 text-xs bg-white border-amber-200"
                                    value={chequeDetails.cheque_date}
                                    onChange={(e) => setChequeDetails({...chequeDetails, cheque_date: e.target.value})}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-amber-700 uppercase">Payor</label>
                                <Input 
                                    placeholder="Payor Name" 
                                    className="h-8 text-xs bg-white border-amber-200"
                                    value={chequeDetails.payee_payor_name}
                                    onChange={(e) => setChequeDetails({...chequeDetails, payee_payor_name: e.target.value})}
                                />
                            </div>
                          </div>
                        )}

                        <Button 
                          className="h-16 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-2xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3 mt-auto"
                          onClick={handlePayNow}
                        >
                          <DollarSign className="h-7 w-7" />
                          <span>PAY NOW (LKR {netTotal.toFixed(2)})</span>
                        </Button>
                      </div>

                      {/* Right Column: Calculations */}
                      <div className="lg:col-span-5 space-y-2.5 bg-slate-50/80 p-4 rounded-xl border border-slate-200/80">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">Subtotal</span>
                          <span className="font-medium text-slate-800">
                            LKR {totals.subtotal.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">Item Discounts</span>
                          <span className="font-medium text-red-600">
                            - LKR {totals.totalItemDiscount.toFixed(2)}
                          </span>
                        </div>
                        {state.isWholesale && wholesaleDiscount > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600">
                              Wholesale Discount ({wholesaleDiscount}%)
                            </span>
                            <span className="font-medium text-red-600">
                              - LKR {wholesaleDiscountAmount.toFixed(2)}
                            </span>
                          </div>
                        )}
                        {generalDiscount > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600">
                              General Discount ({generalDiscount}%)
                            </span>
                            <span className="font-medium text-red-600">
                              - LKR {generalDiscountAmount.toFixed(2)}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between items-center text-sm border-t pt-2 mt-2">
                          <span className="text-slate-600">Discount (%)</span>
                          <div className="relative">
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              step="0.01"
                              className="h-8 w-28 pl-2 pr-7 text-sm bg-white"
                              value={generalDiscount || ""}
                              onChange={(e) =>
                                setGeneralDiscount(
                                  Math.max(0, Math.min(100, Number(e.target.value)))
                                )
                              }
                              placeholder="0"
                            />
                            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                              %
                            </span>
                          </div>
                        </div>
                        <div className="flex justify-between text-base font-semibold pt-2 border-t mt-2">
                          <span className="text-slate-800">Grand Total</span>
                          <span className="text-slate-900">
                            LKR {grandTotal.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-600">Adjustment</span>
                          <Input
                            type="number"
                            className="h-8 max-w-[120px] text-right bg-white"
                            value={adjustment}
                            onChange={(e) =>
                              setAdjustment(parseFloat(e.target.value) || 0)
                            }
                          />
                        </div>
                        <div className="flex justify-between text-2xl font-bold text-blue-700 pt-3 border-t border-slate-200 mt-3 items-center">
                          <div className="flex items-center gap-2">
                             <span className="text-slate-900">Net Total</span>
                             {posResponse?.data?.showReceiptPreview && (
                               <Button 
                                size="icon" 
                                variant="ghost" 
                                className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                                onClick={handleLivePreview}
                                title="Live Preview"
                               >
                                 <Eye className="h-4 w-4" />
                               </Button>
                             )}
                          </div>
                          <span>LKR {netTotal.toFixed(2)}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 mt-2">
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                              Cash In
                            </label>
                            <Input
                              type="number"
                              placeholder="0.00"
                              className="h-10 text-lg font-bold bg-white"
                              value={cashIn || ""}
                              onChange={(e) =>
                                setCashIn(parseFloat(e.target.value) || 0)
                              }
                            />
                          </div>
                          <div className="text-right">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                              Balance
                            </label>
                            <div className="h-10 flex items-center justify-end rounded-md bg-emerald-100 text-emerald-700 font-bold text-xl px-3 border border-emerald-200">
                              {balance.toFixed(2)}
                            </div>
                          </div>
                        </div>
                  </div>
                  </div>
                </footer>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>

        {/* --- Modals --- */}
        
        <Dialog open={isHoldListOpen} onOpenChange={setIsHoldListOpen}>
          <DialogContent className="min-w-7xl w-[95vw] h-[85vh] flex flex-col p-0 overflow-hidden">
            <DialogHeader className="p-6 pb-2">
              <DialogTitle className="text-2xl font-bold flex items-center gap-2 text-slate-800">
                <Archive className="h-6 w-6 text-blue-600" />
                Held Sales (Drafts)
              </DialogTitle>
              <DialogDescription>
                Select a sale to resume or delete it. Resuming will clear your current cart.
              </DialogDescription>
            </DialogHeader>
            <Separator />
            <ScrollArea className="flex-1">
              {isLoadingSales ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
                </div>
              ) : salesData.length > 0 ? (
                <Table className="">
                  <TableHeader className="bg-slate-50 sticky top-0 z-10">
                    <TableRow>
                      <TableHead className="w-[180px] px-6 font-bold text-slate-700">Invoice #</TableHead>
                      <TableHead className="w-[200px] px-6 font-bold text-slate-700">Date & Time</TableHead>
                      <TableHead className="px-6 font-bold text-slate-700">Customer</TableHead>
                      <TableHead className="px-6 font-bold text-slate-700">Items (Details)</TableHead>
                      <TableHead className="px-6 text-right font-bold text-slate-700">Total</TableHead>
                      <TableHead className="px-6 text-center font-bold text-slate-700">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salesData.map((sale) => (
                      <TableRow key={sale.id} className="group hover:bg-blue-50/50 transition-colors">
                        <TableCell className="px-6 font-mono font-medium text-blue-600">
                          {sale.invoice_number}
                        </TableCell>
                        <TableCell className="px-6 text-slate-500 text-xs">
                          {new Date(sale.created_at).toLocaleString()}
                        </TableCell>
                        <TableCell className="px-6">
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-900">{sale.customer?.name || "Walk-in"}</span>
                            <span className="text-[10px] text-slate-400">{sale.customer?.phone || "No Phone"}</span>
                          </div>
                        </TableCell>
                        <TableCell className="px-6">
                          <HoverCard openDelay={100} closeDelay={100}>
                            <HoverCardTrigger asChild>
                              <div className="flex flex-col gap-0.5 cursor-pointer group/items">
                                <Badge variant="secondary" className="w-fit text-[10px] h-5 px-1.5 mb-1 bg-blue-50 text-blue-600 border-none group-hover/items:bg-blue-600 group-hover/items:text-white transition-colors">
                                  {sale.items?.length || 0} Items
                                </Badge>
                                <div className="max-w-[400px]">
                                  <p className="text-[11px] text-slate-500 truncate italic group-hover/items:text-blue-600 transition-colors">
                                    {sale.items?.map(item => `${item.product?.name} (${parseFloat(item.quantity).toFixed(0)})`).join(", ")}
                                  </p>
                                </div>
                              </div>
                            </HoverCardTrigger>
                            <HoverCardContent className="w-96 p-0 overflow-hidden border-slate-200 shadow-2xl animate-in zoom-in-95 duration-200" side="right" align="start">
                              <div className="bg-slate-900 p-4 text-white">
                                <div className="flex justify-between items-center mb-1">
                                  <h4 className="text-sm font-bold uppercase tracking-wider opacity-70">Sale Items Details</h4>
                                  <Badge className="bg-blue-500 hover:bg-blue-500 border-none">{sale.items?.length || 0} Products</Badge>
                                </div>
                                <p className="text-[10px] opacity-50 font-mono">{sale.invoice_number}</p>
                              </div>
                              <div className="p-2 bg-white max-h-[400px] overflow-y-auto">
                                <Table>
                                  <TableHeader className="bg-slate-50">
                                    <TableRow className="hover:bg-transparent border-none">
                                      <TableHead className="h-8 w-12"></TableHead>
                                      <TableHead className="h-8 text-[10px] uppercase font-bold text-slate-500">Product</TableHead>
                                      <TableHead className="h-8 text-[10px] uppercase font-bold text-slate-500 text-center">Qty</TableHead>
                                      <TableHead className="h-8 text-[10px] uppercase font-bold text-slate-500 text-right">Price</TableHead>
                                      <TableHead className="h-8 text-[10px] uppercase font-bold text-slate-500 text-right">Total</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {sale.items?.map((item, idx) => (
                                      <TableRow key={idx} className="border-slate-100 hover:bg-slate-50 transition-colors group/item">
                                        <TableCell className="py-2 px-2">
                                          <div className="h-10 w-10 rounded-md bg-slate-100 overflow-hidden border border-slate-200 flex-shrink-0 relative">
                                            {item.product?.image ? (
                                              <img 
                                                src={`${process.env.NEXT_PUBLIC_API_BASE_URL.replace('/api/v1', '')}/${JSON.parse(item.product.image)[0]}`} 
                                                alt={item.product?.name}
                                                className="h-full w-full object-cover grayscale group-hover/item:grayscale-0 transition-all duration-300"
                                              />
                                            ) : (
                                              <div className="h-full w-full flex items-center justify-center">
                                                <PackageSearch className="h-5 w-5 text-slate-300" />
                                              </div>
                                            )}
                                          </div>
                                        </TableCell>
                                        <TableCell className="py-2 text-xs font-medium text-slate-800">
                                          <div className="flex flex-col">
                                            <span>{item.product?.name}</span>
                                            {item.variant?.name && <span className="text-[9px] text-slate-400">{item.variant.name}</span>}
                                          </div>
                                        </TableCell>
                                        <TableCell className="py-2 text-xs text-center text-slate-600">{parseFloat(item.quantity || 0).toFixed(0)}</TableCell>
                                        <TableCell className="py-2 text-xs text-right text-slate-600">{parseFloat(item.unit_price || item.price || 0).toLocaleString()}</TableCell>
                                        <TableCell className="py-2 text-xs text-right font-bold text-slate-900">
                                          {(parseFloat(item.unit_price || item.price || 0) * parseFloat(item.quantity || 0)).toLocaleString()}
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                                <span className="text-xs font-bold text-slate-500">PAYABLE AMOUNT</span>
                                <span className="text-lg font-black text-blue-600">LKR {parseFloat(sale.payable_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                              </div>
                            </HoverCardContent>
                          </HoverCard>
                        </TableCell>
                        <TableCell className="px-6 text-right">
                          <span className="font-bold text-slate-900">
                            LKR {parseFloat(sale.payable_amount).toFixed(2)}
                          </span>
                        </TableCell>
                        <TableCell className="px-6 text-center">
                          <div className="flex justify-center gap-2">
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => deleteSale(sale.id).then(success => success && fetchSales("draft"))}
                              title="Delete Draft"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              className="h-8 bg-blue-600 hover:bg-blue-700 font-bold px-4"
                              onClick={() => resumeSale(sale)}
                            >
                              Resume
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                  <Archive className="h-20 w-20 mb-4 opacity-10" />
                  <p className="text-xl font-medium">No held sales found</p>
                  <p className="text-sm">Held sales will appear here for you to resume or delete.</p>
                </div>
              )}
            </ScrollArea>
          </DialogContent>
        </Dialog>

        {/* Sale List Modal */}
        <Dialog open={isSaleListOpen} onOpenChange={setIsSaleListOpen}>
          <DialogContent className="min-w-7xl w-[95vw] h-[85vh] flex flex-col p-0 overflow-hidden">
            <DialogHeader className="p-6 pb-2">
              <DialogTitle className="text-2xl font-bold flex items-center gap-2 text-slate-800">
                <List className="h-6 w-6 text-emerald-600" />
                Recent Completed Sales
              </DialogTitle>
              <DialogDescription>
                Viewing the last 50 completed transactions.
              </DialogDescription>
            </DialogHeader>
            <Separator />
            <ScrollArea className="flex-1">
              {isLoadingSales ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
                </div>
              ) : salesData.length > 0 ? (
                <Table>
                  <TableHeader className="bg-slate-50 sticky top-0 z-10">
                    <TableRow>
                      <TableHead className="w-[180px] px-6 font-bold text-slate-700">Invoice #</TableHead>
                      <TableHead className="w-[200px] px-6 font-bold text-slate-700">Date & Time</TableHead>
                      <TableHead className="px-6 font-bold text-slate-700">Customer</TableHead>
                      <TableHead className="px-6 font-bold text-slate-700">Items (Details)</TableHead>
                      <TableHead className="px-6 text-right font-bold text-slate-700">Total</TableHead>
                      <TableHead className="px-6 text-center font-bold text-slate-700">Status</TableHead>
                      <TableHead className="px-6 text-right font-bold text-slate-700">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salesData.map((sale) => (
                      <TableRow key={sale.id} className="group hover:bg-emerald-50/30 transition-colors">
                        <TableCell className="px-6 font-mono font-medium text-emerald-600">
                          {sale.invoice_number}
                        </TableCell>
                        <TableCell className="px-6 text-slate-500 text-xs">
                          {new Date(sale.created_at).toLocaleString()}
                        </TableCell>
                        <TableCell className="px-6">
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-900">{sale.customer?.name || "Walk-in"}</span>
                            <span className="text-[10px] text-slate-400">{sale.customer?.phone || "No Phone"}</span>
                          </div>
                        </TableCell>
                        <TableCell className="px-6">
                          <HoverCard openDelay={100} closeDelay={100}>
                            <HoverCardTrigger asChild>
                              <div className="flex flex-col gap-0.5 cursor-pointer group/items">
                                <Badge variant="secondary" className="w-fit text-[10px] h-5 px-1.5 mb-1 bg-emerald-50 text-emerald-600 border-none group-hover/items:bg-emerald-600 group-hover/items:text-white transition-colors">
                                  {sale.items?.length || 0} Items
                                </Badge>
                                <div className="max-w-[400px]">
                                  <p className="text-[11px] text-slate-500 truncate italic group-hover/items:text-emerald-600 transition-colors">
                                    {sale.items?.map(item => `${item.product?.name} (${parseFloat(item.quantity).toFixed(0)})`).join(", ")}
                                  </p>
                                </div>
                              </div>
                            </HoverCardTrigger>
                            <HoverCardContent className="w-96 p-0 overflow-hidden border-slate-200 shadow-2xl animate-in zoom-in-95 duration-200" side="right" align="start">
                              <div className="bg-emerald-900 p-4 text-white">
                                <div className="flex justify-between items-center mb-1">
                                  <h4 className="text-sm font-bold uppercase tracking-wider opacity-70">Transaction Details</h4>
                                  <Badge className="bg-emerald-500 hover:bg-emerald-500 border-none">{sale.items?.length || 0} Products</Badge>
                                </div>
                                <p className="text-[10px] opacity-50 font-mono">{sale.invoice_number}</p>
                              </div>
                              <div className="p-2 bg-white max-h-[400px] overflow-y-auto">
                                <Table>
                                  <TableHeader className="bg-slate-50">
                                    <TableRow className="hover:bg-transparent border-none">
                                      <TableHead className="h-8 w-12"></TableHead>
                                      <TableHead className="h-8 text-[10px] uppercase font-bold text-slate-500">Product</TableHead>
                                      <TableHead className="h-8 text-[10px] uppercase font-bold text-slate-500 text-center">Qty</TableHead>
                                      <TableHead className="h-8 text-[10px] uppercase font-bold text-slate-500 text-right">Price</TableHead>
                                      <TableHead className="h-8 text-[10px] uppercase font-bold text-slate-500 text-right">Total</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {sale.items?.map((item, idx) => (
                                      <TableRow key={idx} className="border-slate-100 hover:bg-slate-50 transition-colors group/item">
                                        <TableCell className="py-2 px-2">
                                          <div className="h-10 w-10 rounded-md bg-slate-100 overflow-hidden border border-slate-200 flex-shrink-0 relative">
                                            {item.product?.image ? (
                                              <img 
                                                src={`${process.env.NEXT_PUBLIC_API_BASE_URL.replace('/api/v1', '')}/${JSON.parse(item.product.image)[0]}`} 
                                                alt={item.product?.name}
                                                className="h-full w-full object-cover grayscale group-hover/item:grayscale-0 transition-all duration-300"
                                              />
                                            ) : (
                                              <div className="h-full w-full flex items-center justify-center">
                                                <PackageSearch className="h-5 w-5 text-slate-300" />
                                              </div>
                                            )}
                                          </div>
                                        </TableCell>
                                        <TableCell className="py-2 text-xs font-medium text-slate-800">
                                          <div className="flex flex-col">
                                            <span>{item.product?.name}</span>
                                            {item.variant?.name && <span className="text-[9px] text-slate-400">{item.variant.name}</span>}
                                          </div>
                                        </TableCell>
                                        <TableCell className="py-2 text-xs text-center text-slate-600">{parseFloat(item.quantity || 0).toFixed(0)}</TableCell>
                                        <TableCell className="py-2 text-xs text-right text-slate-600">{parseFloat(item.unit_price || item.price || 0).toLocaleString()}</TableCell>
                                        <TableCell className="py-2 text-xs text-right font-bold text-slate-900">
                                          {(parseFloat(item.unit_price || item.price || 0) * parseFloat(item.quantity || 0)).toLocaleString()}
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                                <span className="text-xs font-bold text-slate-500">TOTAL PAID</span>
                                <span className="text-lg font-black text-emerald-600">LKR {parseFloat(sale.payable_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                              </div>
                            </HoverCardContent>
                          </HoverCard>
                        </TableCell>
                        <TableCell className="px-6 text-right">
                          <span className="font-bold text-slate-900">
                            LKR {parseFloat(sale.payable_amount).toFixed(2)}
                          </span>
                        </TableCell>
                        <TableCell className="px-6 text-center">
                          <Badge variant="outline" className="h-5 px-2 bg-green-50 text-green-700 border-green-100 uppercase text-[10px] font-bold">
                            {sale.payment_status}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-6 text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-8 w-8 p-0 text-slate-400 hover:text-orange-600 hover:bg-orange-50"
                              onClick={() => {
                                setSelectedReturnSale(sale);
                                setIsReturnDialogOpen(true);
                              }}
                              title="Sales Return"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-8 w-8 p-0 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
                              onClick={() => {
                                setPrintableSale(sale);
                              }}
                              title="Reprint Invoice"
                            >
                              <Printer className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                  <List className="h-20 w-20 mb-4 opacity-10" />
                  <p className="text-xl font-medium">No completed sales found</p>
                </div>
              )}
            </ScrollArea>
          </DialogContent>
        </Dialog>

        {/* Check Stock Modal */}
        <Dialog open={isStockModalOpen} onOpenChange={setIsStockModalOpen}>
          <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0 overflow-hidden">
            <DialogHeader className="p-6 pb-2">
              <DialogTitle className="text-2xl font-bold flex items-center gap-2 text-slate-800">
                <PackageSearch className="h-6 w-6 text-orange-600" />
                Check Stock Availability
              </DialogTitle>
              <DialogDescription>
                Search for a product by name or barcode to see availability across all branches.
              </DialogDescription>
            </DialogHeader>
            <Separator />
            <div className="p-6 pb-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  placeholder="Enter product name or barcode..."
                  className="pl-10 h-12 text-lg"
                  autoFocus
                  value={stockSearch}
                  onChange={(e) => setStockSearch(e.target.value)}
                />
              </div>
            </div>
            <ScrollArea className="flex-1 p-6">
              {isLoadingStock ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
                </div>
              ) : stockData.length > 0 ? (
                <div className="space-y-6">
                  {stockData.map((item) => (
                    <div key={item.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                      <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center">
                        <div>
                          <h3 className="font-bold text-slate-900">{item.name}</h3>
                          <p className="text-xs text-slate-500 font-mono tracking-wider">{item.barcode}</p>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-8 gap-1.5"
                          onClick={() => {
                            // Find product in local list and add to cart
                            const prod = products.find(p => p.variantId === item.id || p.productId === item.id);
                            if (prod) {
                              dispatch({ type: "ADD_ITEM", payload: { product: prod } });
                              setIsStockModalOpen(false);
                              toast.success(`Added ${item.name} to cart`);
                            }
                          }}
                        >
                          <Plus className="h-3.5 w-3.5" /> Add to Cart
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-0 border-t border-slate-100">
                        {item.stocks && item.stocks.length > 0 ? (
                          item.stocks.map((s, idx) => (
                            <div key={idx} className="p-4 flex flex-col items-center justify-center border-r border-b border-slate-100 last:border-r-0">
                              <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">{s.branch}</span>
                              <span className={clsx(
                                "text-2xl font-black",
                                parseFloat(s.quantity) > 10 ? "text-emerald-600" : parseFloat(s.quantity) > 0 ? "text-orange-500" : "text-red-500"
                              )}>
                                {parseFloat(s.quantity).toFixed(0)}
                              </span>
                              <span className="text-[10px] text-slate-400">Available Units</span>
                              {parseFloat(s.quantity) > 0 && s.branch !== (selectedBranch?.name || 'Current Branch') && (
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="mt-2 h-7 text-[10px] uppercase font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 gap-1 px-2"
                                  onClick={() => {
                                    toast.success(`Transfer request sent to ${s.branch} for ${item.name}`);
                                    // Placeholder for actual transfer logic
                                  }}
                                >
                                  <Truck className="h-3 w-3" /> Request
                                </Button>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="col-span-full p-8 text-center text-slate-400 italic">
                            No stock records found for this item in any branch.
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : stockSearch.length >= 2 ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                  <Search className="h-16 w-16 mb-4 opacity-10" />
                  <p className="text-lg">No products found matching "{stockSearch}"</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                  <PackageSearch className="h-16 w-16 mb-4 opacity-10" />
                  <p className="text-lg font-medium text-slate-500">Search to view availability</p>
                  <p className="text-sm">Type at least 2 characters to start searching.</p>
                </div>
              )}
            </ScrollArea>
          </DialogContent>
        </Dialog>

        {isCalculatorOpen && (
          <CalculatorModal onClose={() => setIsCalculatorOpen(false)} />
        )}
        {selectedReturnSale && (
          <SalesReturnDialog
            open={isReturnDialogOpen}
            onOpenChange={setIsReturnDialogOpen}
            sale={selectedReturnSale}
            onSuccess={() => fetchSales("completed")}
          />
        )}
        
        <SaleDetailSheet 
          isOpen={isDetailOpen}
          onOpenChange={setIsDetailOpen}
          sale={selectedSaleDetail}
          onReprint={(sale) => {
            setPrintableSale(sale);
          }}
        />

        {/* Off-screen Receipt for Printing */}
        <div 
          style={{ 
            position: 'absolute', 
            left: '-9999px', 
            top: 0,
            opacity: 0,
            pointerEvents: 'none'
          }}
        >
          <div className="block print:block">
            <ReceiptTemplate 
              ref={printRef}
              sale={printableSale}
              settings={receiptSettings}
              business={localBusiness}
              branch={selectedBranch}
            />
          </div>
        </div>
      </div>
    </>
  );
}
