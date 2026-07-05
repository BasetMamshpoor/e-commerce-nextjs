#!/usr/bin/env python3
"""Add ConfirmDialog JSX + delete handler to admin pages."""
import re
import os

# Map of file -> service call pattern for delete
FILES_CONFIG = {
    "app/admin/categories/page.tsx": {
        "service": "categoriesService",
        "param": "deleteId",
    },
    "app/admin/banners/page.tsx": {
        "service": "bannersService",
        "param": "deleteId",
    },
    "app/admin/blocked-ips/page.tsx": {
        "service": "securityService",
        "param": "deleteId",
    },
    "app/admin/attributes/page.tsx": {
        "service": "attributesService",
        "param": "deleteId",
    },
    "app/admin/media/page.tsx": {
        "service": "mediaService",
        "param": "deleteId",
    },
    "app/admin/discount-codes/page.tsx": {
        "service": "discountCodesService",
        "param": "deleteId",
    },
    "app/admin/brands/page.tsx": {
        "service": "brandsService",
        "param": "deleteId",
    },
    "app/admin/popups/page.tsx": {
        "service": "popupsService",
        "param": "deleteId",
    },
}

CONFIRM_DIALOG_JSX = '''
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="حذف"
        description="آیا از حذف این مورد مطمئن هستید؟ این عملیات قابل بازگشت نیست."
        confirmText="حذف"
        variant="destructive"
        onConfirm={async () => {
          if (!deleteId) return;
          try {
            await {SERVICE}.delete({PARAM});
            toast.success("حذف شد");
            setDeleteId(null);
            load();
          } catch {
            toast.error("حذف ناموفق بود");
          }
        }}
      />'''

for filepath, config in FILES_CONFIG.items():
    if not os.path.exists(filepath):
        print(f"SKIP: {filepath}")
        continue
    
    with open(filepath, 'r') as f:
        content = f.read()
    
    if 'ConfirmDialog\n        open' in content:
        print(f"SKIP (already has dialog): {filepath}")
        continue
    
    dialog = CONFIRM_DIALOG_JSX.replace("{SERVICE}", config["service"]).replace("{PARAM}", config["param"])
    
    # Find the last </div> before the closing of the component
    # We want to insert before the very last </div> that closes the main return
    # Strategy: find the last occurrence of "    </div>\n  );\n}" and insert before it
    
    pattern = r'(    </div>\n  \);\n\})'
    match = re.search(pattern, content)
    if match:
        insert_pos = match.start()
        content = content[:insert_pos] + dialog + '\n' + content[insert_pos:]
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"DONE: {filepath}")
    else:
        # Try alternative pattern
        pattern2 = r'(</div>\s*\n\s*\)\;\s*\n\})'
        match2 = re.search(pattern2, content)
        if match2:
            insert_pos = match2.start()
            content = content[:insert_pos] + dialog + '\n' + content[insert_pos:]
            with open(filepath, 'w') as f:
                f.write(content)
            print(f"DONE (alt): {filepath}")
        else:
            print(f"FAILED to find insertion point: {filepath}")

print("\nAll done.")
