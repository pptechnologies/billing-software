ALTER TABLE payments
ADD COLUMN IF NOT EXISTS receipt_number TEXT;

-- make it unique (optional but recommended)
CREATE UNIQUE INDEX IF NOT EXISTS payments_receipt_number_uq
ON payments(receipt_number);
