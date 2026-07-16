"use client";

import * as React from "react";
import {
  Upload,
  Trash2,
  Copy,
  Loader2,
  Image as ImageIcon,
  FileText,
  Info,
  Download,
  Pencil,
  Folder,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Film,
  Search,
  RefreshCw,
  AlertTriangle,
  FolderOpen,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { EmptyState } from "@/components/common/empty-state";
import { mediaService } from "@/services";
import { getAccessToken } from "@/lib/api-client";
import { APP_CONFIG } from "@/constants/app";
import type {
  Media,
  MediaFolder,
  MediaListQuery,
  PaginatedData,
  UpdateMediaBody,
} from "@/types/domain";
import { formatDateTimeFa, toPersianDigits } from "@/utils/format";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 30;

/** Convert bytes to a human-readable string in Persian. */
function formatFileSize(bytes: number): string {
  if (bytes === 0 || !bytes) return "۰ بایت";
  const units = ["بایت", "کیلوبایت", "مگابایت", "گیگابایت"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, i);
  return `${toPersianDigits(value.toFixed(value < 10 ? 1 : 0))} ${units[i]}`;
}

const TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "ALL", label: "همه نوع‌ها" },
  { value: "IMAGE", label: "تصویر" },
  { value: "VIDEO", label: "ویدیو" },
  { value: "DOCUMENT", label: "سند" },
  { value: "OTHER", label: "سایر" },
];

const ENTITY_OPTIONS: { value: string; label: string }[] = [
  { value: "ALL", label: "همه موجودیت‌ها" },
  { value: "products", label: "محصولات" },
  { value: "categories", label: "دسته‌بندی‌ها" },
  { value: "brands", label: "برندها" },
  { value: "shipping", label: "شرکت‌های ارسال" },
  { value: "banners", label: "بنرها" },
  { value: "popups", label: "پاپ‌آپ‌ها" },
  { value: "blog", label: "وبلاگ" },
  { value: "stories", label: "استوری‌ها" },
  { value: "tickets", label: "تیکت‌ها" },
  { value: "comments", label: "نظرات" },
  { value: "returns", label: "مرجوعی‌ها" },
  { value: "misc", label: "متفرقه" },
];

export default function AdminMediaPage() {
  const [data, setData] = React.useState<PaginatedData<Media> | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [uploading, setUploading] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const [type, setType] = React.useState<string>("ALL");
  const [entityType, setEntityType] = React.useState<string>("ALL");
  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [detailTarget, setDetailTarget] = React.useState<Media | null>(null);
  const [folderDeleteTarget, setFolderDeleteTarget] = React.useState<MediaFolder | null>(null);
  const [folderDeleting, setFolderDeleting] = React.useState(false);
  const [mobileFoldersOpen, setMobileFoldersOpen] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Debounce search input.
  React.useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  // Fetch media list with current filters.
  const load = React.useCallback(() => {
    setLoading(true);
    const params: MediaListQuery = { page, limit: PAGE_SIZE };
    if (type !== "ALL") params.type = type;
    if (entityType !== "ALL") params.entityType = entityType;
    if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
    mediaService
      .list(params)
      .then(setData)
      .catch(() => toast.error("بارگذاری رسانه‌ها ناموفق بود"))
      .finally(() => setLoading(false));
  }, [page, type, entityType, debouncedSearch]);

  React.useEffect(() => {
    load();
  }, [load]);

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setUploading(true);
    try {
      const targetEntity = entityType !== "ALL" ? entityType : undefined;
      if (files.length === 1) {
        await mediaService.upload(files[0], targetEntity);
        toast.success("فایل آپلود شد");
      } else {
        const result = await mediaService.bulkUpload(files, targetEntity);
        toast.success(`${toPersianDigits(result.items.length)} فایل آپلود شد`);
      }
      load();
    } catch {
      toast.error("آپلود ناموفق بود");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const onCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("آدرس کپی شد");
  };

  const onDelete = async (id: number) => {
    try {
      await mediaService.delete(id);
      toast.success("فایل حذف شد");
      setDetailTarget(null);
      load();
    } catch (e: unknown) {
      const apiErr = e as { message?: string; status?: number };
      if (apiErr?.status === 409) {
        toast.error("این فایل در حال استفاده است. از «حذف اجباری» استفاده کنید.", {
          description: apiErr?.message,
        });
      } else {
        toast.error(apiErr?.message ?? "حذف ناموفق بود");
      }
    }
  };

  const onForceDelete = async (id: number) => {
    try {
      await mediaService.forceDelete(id);
      toast.success("فایل و تمام ارجاعات آن حذف شد");
      setDetailTarget(null);
      setForceDeleteTarget(null);
      load();
    } catch (e: unknown) {
      const apiErr = e as { message?: string };
      toast.error(apiErr?.message ?? "حذف اجباری ناموفق بود");
    }
  };

  const [forceDeleteTarget, setForceDeleteTarget] = React.useState<Media | null>(null);

  const onDownload = async (m: Media) => {
    try {
      const token = getAccessToken();
      const url = `${APP_CONFIG.apiBaseUrl}/media/${m.id}/download`;
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = m.originalName || m.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objectUrl);
      toast.success("دانلود شروع شد");
    } catch {
      toast.error("دانلود ناموفق بود");
    }
  };

  const onConfirmFolderDelete = async () => {
    if (!folderDeleteTarget) return;
    setFolderDeleting(true);
    try {
      await mediaService.removeFolder(
        folderDeleteTarget.entityType,
        folderDeleteTarget.year,
        folderDeleteTarget.month,
      );
      toast.success(
        `پوشه ${folderDeleteTarget.entityType}/${folderDeleteTarget.year}/${folderDeleteTarget.month} حذف شد`,
      );
      setFolderDeleteTarget(null);
      load();
    } catch (e: unknown) {
      const apiErr = e as { message?: string };
      toast.error(apiErr?.message ?? "حذف پوشه ناموفق بود — ممکن است فایل‌ها در حال استفاده باشند");
    } finally {
      setFolderDeleting(false);
    }
  };

  const selectEntity = (e: string) => {
    setEntityType(e);
    setPage(1);
    setMobileFoldersOpen(false);
  };

  const media = data?.items ?? [];
  const totalPages = data?.meta?.totalPages ?? 1;
  const total = data?.meta?.total ?? 0;

  const foldersSidebar = (
    <FoldersSidebar
      activeEntityType={entityType}
      onSelectEntity={selectEntity}
      onDeleteFolder={setFolderDeleteTarget}
    />
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-foreground sm:text-2xl">کتابخانه رسانه</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            آپلود، مرور و مدیریت تصاویر و فایل‌ها
            {total > 0 && (
              <span className="mr-2 nums-fa">({toPersianDigits(total)} فایل)</span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={cn("size-4", loading && "animate-spin")} />
            <span className="hidden sm:inline">به‌روزرسانی</span>
          </Button>
          <Button onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
            آپلود فایل
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*,application/pdf"
            multiple
            onChange={onUpload}
            className="hidden"
          />
        </div>
      </div>

      {/* Filters bar — equal-width responsive grid */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        <div className="space-y-1">
          <Label className="text-[11px] text-muted-foreground">جستجو</Label>
          <div className="relative">
            <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="نام فایل..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 pr-9"
            />
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-[11px] text-muted-foreground">نوع</Label>
          <Select value={type} onValueChange={(v) => { setType(v); setPage(1); }}>
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              {TYPE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-[11px] text-muted-foreground">موجودیت</Label>
          <Select value={entityType} onValueChange={(v) => { setEntityType(v); setPage(1); }}>
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              {ENTITY_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col justify-end">
          <p className="text-[11px] text-muted-foreground nums-fa pb-1.5">
            صفحه {toPersianDigits(page)} از {toPersianDigits(totalPages)}
          </p>
        </div>
      </div>

      {/* Mobile folders trigger + grid */}
      <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
        {/* Desktop sidebar — hidden on mobile */}
        <div className="hidden lg:block">
          {foldersSidebar}
        </div>

        {/* Mobile folders sheet */}
        <Sheet open={mobileFoldersOpen} onOpenChange={setMobileFoldersOpen}>
          <SheetContent side="right" className="w-[280px] overflow-y-auto p-3">
            <SheetHeader className="mb-3">
              <SheetTitle className="flex items-center gap-2 text-sm">
                <Folder className="size-4" />
                پوشه‌های رسانه
              </SheetTitle>
            </SheetHeader>
            {foldersSidebar}
          </SheetContent>
        </Sheet>

        {/* Media grid */}
        <div className="min-w-0">
          {/* Mobile folders button */}
          <Button
            variant="outline"
            size="sm"
            className="mb-3 lg:hidden"
            onClick={() => setMobileFoldersOpen(true)}
          >
            <FolderOpen className="size-4" />
            پوشه‌ها
            {entityType !== "ALL" && (
              <Badge variant="secondary" className="mr-1 text-[10px]">{entityType}</Badge>
            )}
          </Button>

          {loading ? (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-4 xl:grid-cols-5">
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square w-full rounded-lg" />
              ))}
            </div>
          ) : media.length === 0 ? (
            <EmptyState
              icon={<ImageIcon className="size-16" />}
              title="فایلی یافت نشد"
              description={debouncedSearch || type !== "ALL" || entityType !== "ALL"
                ? "با فیلترهای فعلی فایلی پیدا نشد. فیلترها را تغییر دهید."
                : "هنوز فایلی آپلود نشده. روی دکمه آپلود کلیک کنید."}
              action={
                <Button onClick={() => fileInputRef.current?.click()}>
                  <Upload className="size-4" />
                  آپلود فایل
                </Button>
              }
              className="border border-dashed border-border rounded-xl"
            />
          ) : (
            <>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-4 xl:grid-cols-5">
                {media.map((m) => (
                  <MediaCard
                    key={m.id}
                    media={m}
                    onClick={() => setDetailTarget(m)}
                    onCopyUrl={() => onCopyUrl(m.url)}
                  />
                ))}
              </div>
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page === 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronRight className="size-4" />
                    قبلی
                  </Button>
                  <span className="text-xs text-muted-foreground nums-fa">
                    {toPersianDigits(page)} / {toPersianDigits(totalPages)}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page === totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    بعدی
                    <ChevronLeft className="size-4 rotate-180" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Media detail dialog */}
      <MediaDetailDialog
        media={detailTarget}
        onClose={() => setDetailTarget(null)}
        onCopyUrl={onCopyUrl}
        onDownload={onDownload}
        onDelete={onDelete}
        onForceDelete={(m) => {
          setDetailTarget(null);
          setForceDeleteTarget(m);
        }}
        onUpdated={(updated) => {
          setDetailTarget(updated);
          load();
        }}
      />

      {/* Force-delete confirmation */}
      <ForceDeleteDialog
        media={forceDeleteTarget}
        onClose={() => setForceDeleteTarget(null)}
        onConfirm={onForceDelete}
      />

      {/* Folder delete confirmation */}
      <ConfirmDialog
        open={!!folderDeleteTarget}
        onOpenChange={(o) => !o && setFolderDeleteTarget(null)}
        title="حذف پوشه"
        description={
          folderDeleteTarget
            ? `پوشه ${folderDeleteTarget.entityType}/${folderDeleteTarget.year}/${folderDeleteTarget.month} (${toPersianDigits(folderDeleteTarget.fileCount)} فایل، ${formatFileSize(folderDeleteTarget.totalSize)}) حذف شود؟`
            : ""
        }
        confirmText="حذف پوشه"
        variant="destructive"
        onConfirm={onConfirmFolderDelete}
        loading={folderDeleting}
      />
    </div>
  );
}

/* ───────── Media card ───────── */

function MediaCard({
  media,
  onClick,
  onCopyUrl,
}: {
  media: Media;
  onClick: () => void;
  onCopyUrl: () => void;
}) {
  return (
    <Card className="group cursor-pointer overflow-hidden" onClick={onClick}>
      <div className="relative aspect-square overflow-hidden bg-muted">
        {media.type === "IMAGE" ? (
          <img
            src={media.url}
            alt={media.originalName}
            className="h-full w-full object-cover"
            loading="lazy"
            width={150}
            height={150}
          />
        ) : media.type === "VIDEO" ? (
          <div className="flex size-full flex-col items-center justify-center text-muted-foreground">
            <Film className="size-8" />
            <span className="mt-1 text-[10px]">ویدیو</span>
          </div>
        ) : (
          <div className="flex size-full items-center justify-center text-muted-foreground">
            <FileText className="size-8" />
          </div>
        )}
        {/* Type badge */}
        <div className="absolute right-1 top-1">
          <Badge variant="secondary" className="text-[9px]">{media.type}</Badge>
        </div>
        {/* Hover actions (desktop) */}
        <div className="absolute inset-0 hidden items-center justify-center gap-1 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100 sm:flex">
          <Button
            size="icon"
            variant="secondary"
            className="size-7"
            onClick={(e) => { e.stopPropagation(); onClick(); }}
            aria-label="جزئیات"
          >
            <Info className="size-3.5" />
          </Button>
          <Button
            size="icon"
            variant="secondary"
            className="size-7"
            onClick={(e) => { e.stopPropagation(); onCopyUrl(); }}
            aria-label="کپی آدرس"
          >
            <Copy className="size-3.5" />
          </Button>
        </div>
      </div>
      <CardContent className="p-1.5">
        <p className="truncate text-[11px] font-medium text-foreground" title={media.originalName}>
          {media.originalName}
        </p>
        <div className="mt-0.5 flex items-center justify-between gap-1">
          <span className="truncate text-[9px] text-muted-foreground" dir="ltr">
            {media.entityType ?? "misc"}
          </span>
          <span className="shrink-0 text-[9px] text-muted-foreground nums-fa">
            {formatFileSize(media.size)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

/* ───────── Folders sidebar ───────── */

function FoldersSidebar({
  activeEntityType,
  onSelectEntity,
  onDeleteFolder,
}: {
  activeEntityType: string;
  onSelectEntity: (entity: string) => void;
  onDeleteFolder: (folder: MediaFolder) => void;
}) {
  const [folders, setFolders] = React.useState<MediaFolder[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [expandedEntity, setExpandedEntity] = React.useState<string | null>(null);

  const loadFolders = React.useCallback(() => {
    setLoading(true);
    mediaService
      .listFolders()
      .then(setFolders)
      .catch(() => setFolders([]))
      .finally(() => setLoading(false));
  }, []);

  React.useEffect(() => {
    loadFolders();
  }, [loadFolders]);

  // Group folders by entityType → year → month
  const grouped = React.useMemo(() => {
    const map = new Map<string, Map<string, MediaFolder[]>>();
    for (const f of folders) {
      if (!map.has(f.entityType)) map.set(f.entityType, new Map());
      const yearMap = map.get(f.entityType)!;
      if (!yearMap.has(f.year)) yearMap.set(f.year, []);
      yearMap.get(f.year)!.push(f);
    }
    for (const yearMap of map.values()) {
      for (const months of yearMap.values()) {
        months.sort((a, b) => b.month.localeCompare(a.month));
      }
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [folders]);

  const toggleEntity = (entity: string) => {
    setExpandedEntity((prev) => (prev === entity ? null : entity));
  };

  return (
    <Card className="h-fit">
      <CardContent className="p-2.5">
        <div className="mb-2 flex items-center justify-between">
          <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Folder className="size-3.5" />
            پوشه‌ها
          </p>
          <Button size="icon" variant="ghost" className="size-6" onClick={loadFolders} disabled={loading}>
            <RefreshCw className={cn("size-3", loading && "animate-spin")} />
          </Button>
        </div>

        <button
          className={cn(
            "mb-1 flex w-full items-center justify-between rounded-md px-2 py-1.5 text-xs transition-colors",
            activeEntityType === "ALL"
              ? "bg-primary/10 text-primary"
              : "hover:bg-accent text-muted-foreground",
          )}
          onClick={() => onSelectEntity("ALL")}
        >
          <span>همه موجودیت‌ها</span>
        </button>

        {loading ? (
          <div className="space-y-2 py-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-full rounded-md" />
            ))}
          </div>
        ) : grouped.length === 0 ? (
          <p className="py-4 text-center text-[11px] text-muted-foreground">
            پوشه‌ای وجود ندارد
          </p>
        ) : (
          <div className="space-y-0.5">
            {grouped.map(([entity, yearMap]) => {
              const totalFiles = Array.from(yearMap.values())
                .flat()
                .reduce((sum, f) => sum + f.fileCount, 0);
              const isExpanded = expandedEntity === entity;
              return (
                <div key={entity}>
                  <button
                    className={cn(
                      "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-xs transition-colors",
                      activeEntityType === entity
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-accent text-foreground",
                    )}
                    onClick={() => {
                      onSelectEntity(entity);
                      toggleEntity(entity);
                    }}
                  >
                    <span className="flex items-center gap-1.5">
                      {isExpanded ? (
                        <ChevronDown className="size-3" />
                      ) : (
                        <ChevronLeft className="size-3 rotate-180" />
                      )}
                      <Folder className="size-3.5" />
                      {entity}
                    </span>
                    <span className="text-[10px] text-muted-foreground nums-fa">
                      {toPersianDigits(totalFiles)}
                    </span>
                  </button>
                  {isExpanded && (
                    <div className="mr-4 border-r border-border/60 pr-2">
                      {Array.from(yearMap.entries())
                        .sort((a, b) => b[0].localeCompare(a[0]))
                        .map(([year, months]) => (
                          <div key={year}>
                            <p className="px-2 py-1 text-[10px] font-medium text-muted-foreground nums-fa">
                              {toPersianDigits(year)}
                            </p>
                            {months.map((m) => (
                              <div
                                key={`${m.entityType}/${m.year}/${m.month}`}
                                className="group flex items-center justify-between rounded-md px-2 py-1 text-[11px] hover:bg-accent"
                              >
                                <button
                                  className="flex flex-1 items-center gap-1 text-muted-foreground"
                                  onClick={() => onSelectEntity(m.entityType)}
                                >
                                  <span className="nums-fa">{toPersianDigits(Number(m.month))}</span>
                                  <span className="text-[9px]">
                                    ({toPersianDigits(m.fileCount)} فایل)
                                  </span>
                                </button>
                                <button
                                  className="text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                                  onClick={() => onDeleteFolder(m)}
                                  title="حذف پوشه"
                                >
                                  <Trash2 className="size-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ───────── Media detail dialog (with edit / download / usage / force-delete) ───────── */

function MediaDetailDialog({
  media,
  onClose,
  onCopyUrl,
  onDownload,
  onDelete,
  onForceDelete,
  onUpdated,
}: {
  media: Media | null;
  onClose: () => void;
  onCopyUrl: (url: string) => void;
  onDownload: (m: Media) => void;
  onDelete: (id: number) => void;
  onForceDelete: (m: Media) => void;
  onUpdated: (m: Media) => void;
}) {
  const [tab, setTab] = React.useState<"info" | "usage">("info");
  const [usage, setUsage] = React.useState<string[] | null>(null);
  const [usageLoading, setUsageLoading] = React.useState(false);
  const [editName, setEditName] = React.useState("");
  const [editEntity, setEditEntity] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (media) {
      setTab("info");
      setUsage(null);
      setEditName(media.originalName);
      setEditEntity(media.entityType ?? "");
    }
  }, [media]);

  const loadUsage = React.useCallback(async () => {
    if (!media) return;
    setUsageLoading(true);
    try {
      const result = await mediaService.usage(media.id);
      setUsage(result.usage);
    } catch {
      toast.error("بارگذاری محل استفاده ناموفق بود");
    } finally {
      setUsageLoading(false);
    }
  }, [media]);

  React.useEffect(() => {
    if (media && tab === "usage" && usage === null) {
      loadUsage();
    }
  }, [media, tab, usage, loadUsage]);

  if (!media) return null;

  const onSave = async () => {
    setSaving(true);
    try {
      const body: UpdateMediaBody = {};
      if (editName.trim() && editName !== media.originalName) body.originalName = editName.trim();
      if (editEntity !== (media.entityType ?? "")) body.entityType = editEntity.trim().toLowerCase() || "misc";
      if (Object.keys(body).length === 0) {
        toast.info("تغییری برای ذخیره نیست");
        return;
      }
      const updated = await mediaService.update(media.id, body);
      toast.success("اطلاعات رسانه به‌روزرسانی شد");
      onUpdated(updated);
    } catch (e: unknown) {
      const apiErr = e as { message?: string };
      toast.error(apiErr?.message ?? "به‌روزرسانی ناموفق بود");
    } finally {
      setSaving(false);
    }
  };

  const hasUsage = usage && usage.length > 0;

  return (
    <Dialog open={!!media} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>جزئیات رسانه</DialogTitle>
          <DialogDescription className="truncate" dir="ltr">
            {media.originalName}
          </DialogDescription>
        </DialogHeader>

        {/* Preview — constrained height, never full-size */}
        <div className="overflow-hidden rounded-xl border border-border bg-muted">
          {media.type === "IMAGE" ? (
            <img
              src={media.url}
              alt={media.originalName}
              className="mx-auto max-h-56 w-full object-contain"
            />
          ) : media.type === "VIDEO" ? (
            <video src={media.url} className="max-h-56 w-full" controls muted />
          ) : (
            <div className="flex h-32 items-center justify-center text-muted-foreground">
              <FileText className="size-12" />
            </div>
          )}
        </div>

        {/* Tab switcher */}
        <div className="flex gap-1 border-b">
          <button
            className={cn(
              "px-3 py-2 text-sm font-medium transition-colors",
              tab === "info"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
            onClick={() => setTab("info")}
          >
            اطلاعات
          </button>
          <button
            className={cn(
              "px-3 py-2 text-sm font-medium transition-colors",
              tab === "usage"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
            onClick={() => setTab("usage")}
          >
            محل استفاده
            {hasUsage && (
              <Badge variant="destructive" className="mr-1 text-[9px]">{usage!.length}</Badge>
            )}
          </button>
        </div>

        {tab === "info" ? (
          <div className="space-y-3">
            {/* Read-only metadata */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-muted-foreground">نوع</p>
                <Badge variant="outline" className="mt-0.5 text-[10px]">{media.type}</Badge>
              </div>
              <div>
                <p className="text-muted-foreground">MIME</p>
                <p className="font-mono text-[10px]" dir="ltr">{media.mimeType}</p>
              </div>
              <div>
                <p className="text-muted-foreground">حجم</p>
                <p className="nums-fa">{formatFileSize(media.size)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">تاریخ آپلود</p>
                <p>{formatDateTimeFa(media.createdAt)}</p>
              </div>
              <div className="col-span-2">
                <p className="text-muted-foreground">مسیر فایل</p>
                <p className="truncate font-mono text-[10px]" dir="ltr">{media.filePath ?? "—"}</p>
              </div>
              <div className="col-span-2">
                <p className="text-muted-foreground">شناسه</p>
                <p className="nums-fa">#{toPersianDigits(media.id)}</p>
              </div>
            </div>

            {/* Editable fields */}
            <div className="space-y-2 border-t pt-3">
              <div>
                <Label className="text-xs">نام اصلی فایل</Label>
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} dir="ltr" className="mt-1 text-left" />
              </div>
              <div>
                <Label className="text-xs">نوع موجودیت (entityType)</Label>
                <Input
                  value={editEntity}
                  onChange={(e) => setEditEntity(e.target.value)}
                  placeholder="مثلاً: products یا blog"
                  dir="ltr"
                  className="mt-1 text-left"
                />
                <p className="mt-1 text-[10px] text-muted-foreground">
                  برای دسته‌بندی فایل در پوشه مناسب استفاده می‌شود.
                </p>
              </div>
              <Button onClick={onSave} disabled={saving} size="sm">
                {saving ? <Loader2 className="size-4 animate-spin" /> : <Pencil className="size-4" />}
                ذخیره تغییرات
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {usageLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </div>
            ) : !hasUsage ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                این فایل در هیچ‌کجا استفاده نشده است.
              </div>
            ) : (
              <>
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900/50 dark:bg-amber-950/30">
                  <p className="flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-400">
                    <AlertTriangle className="size-3.5" />
                    این فایل در {toPersianDigits(usage!.length)} مورد استفاده شده است.
                  </p>
                  <p className="mt-1 text-[11px] text-amber-600 dark:text-amber-500">
                    حذف عادی ممکن است ناموفق باشد. برای حذف کامل، از «حذف اجباری» استفاده کنید.
                  </p>
                </div>
                <div className="space-y-1.5">
                  {usage!.map((u, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 rounded-lg border border-border/40 p-2 text-sm"
                    >
                      <Badge variant="secondary" className="text-[10px]">{idx + 1}</Badge>
                      <span>{u}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        <DialogFooter className="flex-row flex-wrap justify-between gap-2 sm:justify-between">
          <div className="flex flex-wrap gap-1.5">
            <Button variant="outline" size="sm" onClick={() => onCopyUrl(media.url)}>
              <Copy className="size-4" />
              کپی
            </Button>
            <Button variant="outline" size="sm" onClick={() => onDownload(media)}>
              <Download className="size-4" />
              دانلود
            </Button>
          </div>
          <div className="flex gap-1.5">
            <Button variant="ghost" size="sm" onClick={onClose}>بستن</Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                onDelete(media.id);
              }}
            >
              <Trash2 className="size-4" />
              حذف
            </Button>
            {hasUsage && (
              <Button
                variant="destructive"
                size="sm"
                className="bg-red-700 hover:bg-red-800"
                onClick={() => onForceDelete(media)}
              >
                <AlertTriangle className="size-4" />
                حذف اجباری
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ───────── Force-delete confirmation dialog ───────── */

function ForceDeleteDialog({
  media,
  onClose,
  onConfirm,
}: {
  media: Media | null;
  onClose: () => void;
  onConfirm: (id: number) => void;
}) {
  const [usage, setUsage] = React.useState<string[] | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  React.useEffect(() => {
    if (media) {
      setUsage(null);
      setLoading(true);
      mediaService
        .usage(media.id)
        .then((r) => setUsage(r.usage))
        .catch(() => setUsage([]))
        .finally(() => setLoading(false));
    }
  }, [media]);

  if (!media) return null;

  const onConfirmDelete = async () => {
    setDeleting(true);
    await onConfirm(media.id);
    setDeleting(false);
  };

  return (
    <Dialog open={!!media} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="size-5" />
            حذف اجباری فایل
          </DialogTitle>
          <DialogDescription>
            این عمل قابل بازگشت نیست.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {/* Warning */}
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
            <p className="text-sm font-medium text-foreground">
              {media.originalName}
            </p>
            <p className="mt-1 text-xs text-muted-foreground nums-fa">
              شناسه: #{toPersianDigits(media.id)} — حجم: {formatFileSize(media.size)}
            </p>
          </div>

          {/* Usage list */}
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : usage && usage.length > 0 ? (
            <div>
              <p className="mb-2 text-xs font-medium text-destructive">
                این فایل از موارد زیر حذف خواهد شد:
              </p>
              <div className="max-h-40 space-y-1 overflow-y-auto">
                {usage.map((u, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 rounded-md border border-border/40 p-1.5 text-xs"
                  >
                    <Badge variant="outline" className="text-[9px]">{idx + 1}</Badge>
                    <span>{u}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              این فایل در حال حاضر در جایی استفاده نمی‌شود.
            </p>
          )}

          <div className="rounded-lg bg-destructive/10 p-2.5 text-xs text-destructive">
            <AlertTriangle className="mb-1 size-3.5" />
            با تأیید، فایل از دیسک حذف شده و تمام ارجاعات آن (تصاویر محصول، لوگوها، بنرها و...) null یا حذف خواهند شد.
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={deleting}>
            انصراف
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirmDelete}
            disabled={deleting}
            className="bg-red-700 hover:bg-red-800"
          >
            {deleting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <AlertTriangle className="size-4" />
            )}
            بله، حذف اجباری کن
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
