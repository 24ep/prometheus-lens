import { AppLayout } from '@/components/layout/app-layout';
import { AssetConnectionWizard } from '@/components/assets/asset-connection-wizard';

export default function NewAssetPage() {
  return (
    <AppLayout>
      <div className="container mx-auto py-4">
        <AssetConnectionWizard />
      </div>
    </AppLayout>
  );
}
