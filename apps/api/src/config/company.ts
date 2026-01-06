type CompanyConfig = {
  name: string;
  address: string;
  vatPan: string;
  phone?: string;
  email?: string;
  logoUrl?: string; // optional (later)
};

function required(name: string, value: string | undefined) {
  if (!value || !value.trim()) throw new Error(`Missing env var: ${name}`);
  return value.trim();
}

export const company: CompanyConfig = {
  name: required("COMPANY_NAME", process.env.COMPANY_NAME),
  address: required("COMPANY_ADDRESS", process.env.COMPANY_ADDRESS),
  vatPan: required("COMPANY_VAT_PAN", process.env.COMPANY_VAT_PAN),
  phone: process.env.COMPANY_PHONE?.trim(),
  email: process.env.COMPANY_EMAIL?.trim(),
  logoUrl: process.env.COMPANY_LOGO_URL?.trim(),
};
