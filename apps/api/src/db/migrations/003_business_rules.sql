-- 003_business_rules.sql

-- 1) Basic sanity checks
ALTER TABLE payments
  ADD CONSTRAINT payments_amount_positive CHECK (amount > 0);

ALTER TABLE invoice_items
  ADD CONSTRAINT invoice_items_qty_positive CHECK (qty > 0),
  ADD CONSTRAINT invoice_items_unit_price_nonneg CHECK (unit_price >= 0),
  ADD CONSTRAINT invoice_items_line_total_nonneg CHECK (line_total >= 0);

ALTER TABLE invoices
  ADD CONSTRAINT invoices_totals_nonneg CHECK (
    subtotal >= 0 AND tax_total >= 0 AND total >= 0
  );

-- 2) Prevent editing invoice rows once not draft (DB protection)
-- Allow only status/updated_at changes after draft.
CREATE OR REPLACE FUNCTION prevent_invoice_edits_when_not_draft()
RETURNS trigger AS $$
BEGIN
  IF OLD.status <> 'draft' THEN
    -- block if any protected column changed
    IF (NEW.client_id IS DISTINCT FROM OLD.client_id) OR
       (NEW.invoice_number IS DISTINCT FROM OLD.invoice_number) OR
       (NEW.issue_date IS DISTINCT FROM OLD.issue_date) OR
       (NEW.due_date IS DISTINCT FROM OLD.due_date) OR
       (NEW.currency IS DISTINCT FROM OLD.currency) OR
       (NEW.notes IS DISTINCT FROM OLD.notes) OR
       (NEW.subtotal IS DISTINCT FROM OLD.subtotal) OR
       (NEW.tax_rate IS DISTINCT FROM OLD.tax_rate) OR
       (NEW.tax_total IS DISTINCT FROM OLD.tax_total) OR
       (NEW.total IS DISTINCT FROM OLD.total)
    THEN
      RAISE EXCEPTION 'Invoice % is not draft; edits are not allowed', OLD.id;
    END IF;

    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


DROP TRIGGER IF EXISTS trg_prevent_invoice_edits ON invoices;
CREATE TRIGGER trg_prevent_invoice_edits
BEFORE UPDATE ON invoices
FOR EACH ROW
EXECUTE FUNCTION prevent_invoice_edits_when_not_draft();

-- 3) Prevent editing invoice items after invoice is not draft
CREATE OR REPLACE FUNCTION prevent_item_edits_when_invoice_not_draft()
RETURNS trigger AS $$
DECLARE inv_status invoice_status;
BEGIN
  SELECT status INTO inv_status FROM invoices WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);

  IF inv_status <> 'draft' THEN
    RAISE EXCEPTION 'Invoice is not draft; line items cannot be edited';
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_item_ins ON invoice_items;
DROP TRIGGER IF EXISTS trg_prevent_item_upd ON invoice_items;
DROP TRIGGER IF EXISTS trg_prevent_item_del ON invoice_items;

CREATE TRIGGER trg_prevent_item_ins
BEFORE INSERT ON invoice_items
FOR EACH ROW
EXECUTE FUNCTION prevent_item_edits_when_invoice_not_draft();

CREATE TRIGGER trg_prevent_item_upd
BEFORE UPDATE ON invoice_items
FOR EACH ROW
EXECUTE FUNCTION prevent_item_edits_when_invoice_not_draft();

CREATE TRIGGER trg_prevent_item_del
BEFORE DELETE ON invoice_items
FOR EACH ROW
EXECUTE FUNCTION prevent_item_edits_when_invoice_not_draft();
