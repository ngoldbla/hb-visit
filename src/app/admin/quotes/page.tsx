"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RefreshCw, Plus, Pencil, Trash2, Quote as QuoteIcon } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/lib/supabase/types";

type Quote = Database["public"]["Tables"]["quotes"]["Row"];

interface QuoteForm {
  text: string;
  author: string;
  category: string;
  source: string;
}

const CATEGORIES = [
  "Motivation",
  "Innovation",
  "Entrepreneurship",
  "Persistence",
  "Leadership",
  "Creativity",
  "Success",
  "Learning",
];

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [deletingQuote, setDeletingQuote] = useState<Quote | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [quoteForm, setQuoteForm] = useState<QuoteForm>({
    text: "",
    author: "",
    category: "",
    source: "",
  });
  const [saving, setSaving] = useState(false);

  async function fetchQuotes() {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/quotes");
      const data = await response.json();
      if (data.success) {
        setQuotes(data.quotes || []);
      }
    } catch {
      toast.error("Failed to fetch quotes");
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchQuotes();
  }, []);

  function openEditDialog(quote: Quote) {
    setQuoteForm({
      text: quote.text,
      author: quote.author || "",
      category: quote.category || "",
      source: quote.source || "",
    });
    setEditingQuote(quote);
  }

  function openAddDialog() {
    setQuoteForm({
      text: "",
      author: "",
      category: "",
      source: "",
    });
    setShowAddDialog(true);
  }

  async function saveQuote() {
    if (!quoteForm.text.trim()) {
      toast.error("Quote text is required");
      return;
    }

    setSaving(true);
    try {
      const isEditing = !!editingQuote;
      const response = await fetch("/api/admin/quotes", {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(isEditing && { id: editingQuote.id }),
          text: quoteForm.text,
          author: quoteForm.author || null,
          category: quoteForm.category || null,
          source: quoteForm.source || null,
        }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success(isEditing ? "Quote updated" : "Quote added");
        setEditingQuote(null);
        setShowAddDialog(false);
        fetchQuotes();
      } else {
        toast.error(result.error || "Failed to save quote");
      }
    } catch {
      toast.error("Failed to save quote");
    }
    setSaving(false);
  }

  async function deleteQuote() {
    if (!deletingQuote) return;

    setSaving(true);
    try {
      const response = await fetch("/api/admin/quotes", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deletingQuote.id }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success("Quote deleted");
        setDeletingQuote(null);
        fetchQuotes();
      } else {
        toast.error(result.error || "Failed to delete quote");
      }
    } catch {
      toast.error("Failed to delete quote");
    }
    setSaving(false);
  }

  async function toggleQuoteActive(quote: Quote) {
    try {
      const response = await fetch("/api/admin/quotes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: quote.id,
          is_active: !quote.is_active,
        }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success(quote.is_active ? "Quote disabled" : "Quote enabled");
        fetchQuotes();
      } else {
        toast.error(result.error || "Failed to update quote");
      }
    } catch {
      toast.error("Failed to update quote");
    }
  }

  const activeQuotes = quotes.filter((q) => q.is_active !== false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quotes</h1>
          <p className="text-gray-600 mt-1">
            Manage quotes displayed in attract mode ({activeQuotes.length} active)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={openAddDialog}>
            <Plus className="w-4 h-4 mr-2" />
            Add Quote
          </Button>
          <Button variant="outline" onClick={fetchQuotes} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50%]">Quote</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Active</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  Loading quotes...
                </TableCell>
              </TableRow>
            ) : quotes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <div className="flex flex-col items-center gap-2">
                    <QuoteIcon className="w-8 h-8 text-gray-400" />
                    <p className="text-gray-500">No quotes yet</p>
                    <Button variant="outline" size="sm" onClick={openAddDialog}>
                      Add your first quote
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              quotes.map((quote) => (
                <TableRow
                  key={quote.id}
                  className={quote.is_active === false ? "opacity-50" : ""}
                >
                  <TableCell>
                    <p className="line-clamp-2 text-sm">{quote.text}</p>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {quote.author || "-"}
                  </TableCell>
                  <TableCell>
                    {quote.category && (
                      <Badge variant="outline">{quote.category}</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={quote.is_active !== false}
                      onCheckedChange={() => toggleQuoteActive(quote)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(quote)}
                        className="h-8 w-8 p-0"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeletingQuote(quote)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Add/Edit Quote Dialog */}
      <Dialog
        open={showAddDialog || !!editingQuote}
        onOpenChange={() => {
          setShowAddDialog(false);
          setEditingQuote(null);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingQuote ? "Edit Quote" : "Add Quote"}</DialogTitle>
            <DialogDescription>
              {editingQuote
                ? "Update the quote text and attribution."
                : "Add a new inspirational quote to display in attract mode."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="text">Quote Text *</Label>
              <Textarea
                id="text"
                rows={4}
                placeholder="Enter the quote..."
                value={quoteForm.text}
                onChange={(e) =>
                  setQuoteForm({ ...quoteForm, text: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="author">Author</Label>
                <Input
                  id="author"
                  placeholder="e.g., Steve Jobs"
                  value={quoteForm.author}
                  onChange={(e) =>
                    setQuoteForm({ ...quoteForm, author: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="source">Source</Label>
                <Input
                  id="source"
                  placeholder="e.g., Stanford Commencement"
                  value={quoteForm.source}
                  onChange={(e) =>
                    setQuoteForm({ ...quoteForm, source: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <Button
                    key={cat}
                    type="button"
                    variant={quoteForm.category === cat ? "default" : "outline"}
                    size="sm"
                    onClick={() =>
                      setQuoteForm({
                        ...quoteForm,
                        category: quoteForm.category === cat ? "" : cat,
                      })
                    }
                  >
                    {cat}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddDialog(false);
                setEditingQuote(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={saveQuote} disabled={saving || !quoteForm.text.trim()}>
              {saving ? "Saving..." : editingQuote ? "Save Changes" : "Add Quote"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingQuote} onOpenChange={() => setDeletingQuote(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              Delete Quote
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this quote? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          {deletingQuote && (
            <div className="bg-gray-50 rounded-lg p-4 my-4">
              <p className="text-sm text-gray-600 italic">
                &ldquo;{deletingQuote.text.slice(0, 100)}
                {deletingQuote.text.length > 100 ? "..." : ""}&rdquo;
              </p>
              {deletingQuote.author && (
                <p className="text-sm text-gray-500 mt-2">
                  &mdash; {deletingQuote.author}
                </p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingQuote(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={deleteQuote} disabled={saving}>
              {saving ? "Deleting..." : "Delete Quote"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
