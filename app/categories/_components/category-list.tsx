"use client";

import { Button } from "@/app/_components/ui/button";
import { Input } from "@/app/_components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/_components/ui/card";
import {
  createCustomCategory,
  deleteCustomCategory,
  updateCustomCategory,
} from "@/app/_actions/custom-categories";
import { Loader2Icon, PencilIcon, PlusIcon, TrashIcon, XIcon, CheckIcon } from "lucide-react";
import { useState } from "react";

interface CustomCategory {
  id: string;
  name: string;
}

interface CategoryListProps {
  categories: CustomCategory[];
}

const CategoryList = ({ categories }: CategoryListProps) => {
  const [newName, setNewName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      setIsCreating(true);
      await createCustomCategory({ name: newName.trim() });
      setNewName("");
    } catch (error) {
      console.error(error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdate = async (id: string) => {
    if (!editName.trim()) return;
    try {
      setLoadingId(id);
      await updateCustomCategory(id, { name: editName.trim() });
      setEditingId(null);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setLoadingId(id);
      await deleteCustomCategory(id);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Suas categorias</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Nova categoria..."
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreate();
            }}
          />
          <Button onClick={handleCreate} disabled={isCreating || !newName.trim()}>
            {isCreating ? (
              <Loader2Icon className="animate-spin" />
            ) : (
              <PlusIcon />
            )}
            Criar
          </Button>
        </div>

        {categories.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Nenhuma categoria customizada criada.
          </p>
        ) : (
          <div className="space-y-2">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                {editingId === cat.id ? (
                  <div className="flex flex-1 items-center gap-2">
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleUpdate(cat.id);
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      className="h-8"
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleUpdate(cat.id)}
                      disabled={loadingId === cat.id}
                    >
                      {loadingId === cat.id ? (
                        <Loader2Icon className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckIcon className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setEditingId(null)}
                    >
                      <XIcon className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <span className="text-sm font-medium">{cat.name}</span>
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-muted-foreground"
                        onClick={() => {
                          setEditingId(cat.id);
                          setEditName(cat.name);
                        }}
                      >
                        <PencilIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-muted-foreground"
                        onClick={() => handleDelete(cat.id)}
                        disabled={loadingId === cat.id}
                      >
                        {loadingId === cat.id ? (
                          <Loader2Icon className="h-4 w-4 animate-spin" />
                        ) : (
                          <TrashIcon className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CategoryList;
