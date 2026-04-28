const fs = require('fs');

const path = 'src/components/v30/QuoteConfigurator.js';
let content = fs.readFileSync(path, 'utf8');

// 1. Add hook import
content = content.replace(
    /import { round2, sanitizeFloat } from '\.\.\/\.\.\/utils\/mathUtils';/,
    "import { round2, sanitizeFloat } from '../../utils/mathUtils';\nimport { useQuoteLogic } from '../../hooks/useQuoteLogic';"
);

// 2. Extirpate state/logic block
const p1 = "const [selectedProduct, setSelectedProduct] = useState(null);";
const p2 = "        if (reactToPrintFn) {\n            reactToPrintFn();\n        }\n    };";

const startIndex = content.indexOf(p1);
const endIndex = content.indexOf(p2) + p2.length;

if (startIndex > -1 && endIndex > startIndex) {
    const injectedCode = `const [showClientSearch, setShowClientSearch] = useState(false);
    const [filterTerm, setFilterTerm] = useState('');
    const [clientSearchTerm, setClientSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('Todas');
    const [viewMode, setViewMode] = useState('edit');
    const [mobileTab, setMobileTab] = useState('products');
    const [zoomLevel, setZoomLevel] = useState(0.8);
    const [docType, setDocType] = useState('quote');
    const toast = useToast();

    // Ref for printable document
    const printableDocRef = useRef(null);

    const {
        selectedProduct, setSelectedProduct,
        dims, setDims,
        locationLabel, setLocationLabel,
        client, setClient,
        financials, setFinancials,
        quoteMeta, setQuoteMeta,
        saveStatus, setSaveStatus,
        vatRate,
        selectedExtras, toggleExtra, updateExtraQty,
        dropdownSelections, setDropdownSelections,
        calculatedPrice, addToQuote,
        updateQuantity, removeFromCart, moveCartItem,
        grossTotal, discountAmount, netTotal, grandTotal, remainingBalance,
        handleSave, handleLocalReset
    } = useQuoteLogic({ initialData, cart, setCart, config, onSave, toast });

    // Configure react-to-print with dynamic filename
    const reactToPrintFn = useReactToPrint({
        contentRef: printableDocRef,
        documentTitle: \`\${client.name?.replace(/\\s+/g, '') || 'Cliente'}_\${quoteMeta.number}\`,
    });

    const handlePrintPDF = () => {
        if (reactToPrintFn) {
            reactToPrintFn();
        }
    };`;
    content = content.substring(0, startIndex) + injectedCode + content.substring(endIndex);
} else {
    console.error("No se encontró el bloque principal p1 o p2");
}

// 3. Extirpate handleLocalReset
const resetStart = "    const handleLocalReset = () => {";
const resetEnd = "        toast(\"Formulario limpio\", \"success\");\n    };\n";
const rsIndex = content.indexOf(resetStart);
if (rsIndex > -1) {
    const blockEndIndex = content.indexOf(resetEnd, rsIndex) + resetEnd.length;
    content = content.substring(0, rsIndex) + content.substring(blockEndIndex);
} else {
    console.warn("No se encontró handleLocalReset para eliminar");
}

fs.writeFileSync(path, content);
console.log("Refactor super-preciso completado en QuoteConfigurator.js");
