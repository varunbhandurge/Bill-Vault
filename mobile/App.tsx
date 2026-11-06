import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView, 
  StatusBar,
  FlatList,
  Alert
} from 'react-native';
import { AssetCareApi } from './src/services/api';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'assets' | 'scan' | 'warranties' | 'reminders'>('dashboard');
  const [assets, setAssets] = useState<any[]>([]);
  const [reminders, setReminders] = useState<any[]>([]);
  const [warranties, setWarranties] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);

  useEffect(() => {
    // Initial demo sign-in to populate data
    AssetCareApi.login('admin', 'admin')
      .then(() => loadData())
      .catch(() => loadData());
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const a = await AssetCareApi.getAssets();
      setAssets(a.assets || []);
      const r = await AssetCareApi.getReminders();
      setReminders(r.reminders || []);
      const w = await AssetCareApi.getWarranties();
      setWarranties(w.warranties || []);
    } catch (e) {
      console.log('Mobile load err:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAsset = async (id: string) => {
    try {
      const res = await AssetCareApi.getAssetDetails(id);
      setSelectedAsset(res);
    } catch (e) {
      Alert.alert('Error', 'Unable to fetch asset details.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      
      {/* Top Mobile Bar */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.badgeIcon}>
            <Text style={styles.badgeText}>🛡️</Text>
          </View>
          <View>
            <Text style={styles.brandTitle}>Asset<Text style={styles.brandAccent}>Care</Text></Text>
            <Text style={styles.brandSubtitle}>Personal Digital Vault</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.scanHeaderBtn} onPress={() => setCurrentTab('scan')}>
          <Text style={styles.scanHeaderBtnText}>📷 Scan Bill</Text>
        </TouchableOpacity>
      </View>

      {/* Screen Body */}
      <View style={styles.content}>
        {selectedAsset ? (
          <ScrollView style={styles.scroll}>
            <TouchableOpacity style={styles.backBtn} onPress={() => setSelectedAsset(null)}>
              <Text style={styles.backBtnText}>← Back to All Assets</Text>
            </TouchableOpacity>

            <View style={styles.card}>
              <Text style={styles.assetCategory}>{selectedAsset.asset?.category_name}</Text>
              <Text style={styles.assetTitle}>{selectedAsset.asset?.name}</Text>
              <Text style={styles.assetSubtitle}>{selectedAsset.asset?.brand} • {selectedAsset.asset?.model}</Text>
              {selectedAsset.asset?.registration_number && (
                <View style={styles.regBadge}>
                  <Text style={styles.regBadgeText}>{selectedAsset.asset?.registration_number}</Text>
                </View>
              )}
            </View>

            {/* Service & Repair History */}
            <Text style={styles.sectionHeader}>Service & Repair History</Text>
            {selectedAsset.serviceRecords?.map((s: any) => (
              <View key={s.id} style={styles.historyCard}>
                <View style={styles.rowBetween}>
                  <Text style={styles.historyDate}>{s.service_date}</Text>
                  <Text style={styles.historyAmount}>₹{s.total_amount?.toLocaleString()}</Text>
                </View>
                <Text style={styles.historyComponent}>{s.component}</Text>
                <Text style={styles.historyDesc}>{s.description_of_work}</Text>
                <Text style={styles.historyVendor}>Provider: {s.vendor_name}</Text>
                {s.warranty_duration_months > 0 && (
                  <View style={styles.warrantyPill}>
                    <Text style={styles.warrantyPillText}>
                      🛡️ {s.warranty_duration_months} Mo. Warranty (Exp: {s.warranty_expiry_date})
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </ScrollView>
        ) : currentTab === 'dashboard' ? (
          <ScrollView style={styles.scroll}>
            {/* Quick Metrics */}
            <View style={styles.metricRow}>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Assets</Text>
                <Text style={styles.metricVal}>{assets.length}</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Warranties</Text>
                <Text style={styles.metricVal}>{warranties.length}</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Reminders</Text>
                <Text style={styles.metricVal}>{reminders.length}</Text>
              </View>
            </View>

            {/* Featured 16-yr car banner */}
            <View style={styles.heroBanner}>
              <Text style={styles.heroBadge}>Active Warranty Protection</Text>
              <Text style={styles.heroTitle}>Honda City: AC Compressor Repaired</Text>
              <Text style={styles.heroDesc}>
                Repaired for ₹6,000 on 06-Nov-2026. 3-Month warranty valid till 06-Feb-2027 by Apex Auto Cooling Works.
              </Text>
              <TouchableOpacity
                style={styles.heroBtn}
                onPress={() => handleOpenAsset('asset-car-001')}
              >
                <Text style={styles.heroBtnText}>Open AC Repair History</Text>
              </TouchableOpacity>
            </View>

            {/* Recent Assets */}
            <Text style={styles.sectionHeader}>Your Registered Assets</Text>
            {assets.map((a) => (
              <TouchableOpacity
                key={a.id}
                style={styles.assetCard}
                onPress={() => handleOpenAsset(a.id)}
              >
                <View>
                  <Text style={styles.cardTitle}>{a.name}</Text>
                  <Text style={styles.cardSubtitle}>{a.brand} • {a.category_name}</Text>
                </View>
                <Text style={styles.viewLink}>View →</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : currentTab === 'assets' ? (
          <ScrollView style={styles.scroll}>
            <Text style={styles.sectionHeader}>All Assets ({assets.length})</Text>
            {assets.map((a) => (
              <TouchableOpacity
                key={a.id}
                style={styles.assetCard}
                onPress={() => handleOpenAsset(a.id)}
              >
                <View>
                  <Text style={styles.cardTitle}>{a.name}</Text>
                  <Text style={styles.cardSubtitle}>{a.brand} • {a.category_name}</Text>
                  {a.registration_number && (
                    <Text style={styles.regSubtitle}>Reg: {a.registration_number}</Text>
                  )}
                </View>
                <Text style={styles.viewLink}>History →</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : currentTab === 'scan' ? (
          <View style={styles.scanContainer}>
            <Text style={styles.scanIcon}>📸</Text>
            <Text style={styles.scanTitle}>Instant Invoice Scanner</Text>
            <Text style={styles.scanDesc}>
              Photograph any purchase bill, repair invoice, or service receipt. Our OCR engine extracts components, amounts, and dates automatically.
            </Text>
            <TouchableOpacity
              style={styles.scanActionBtn}
              onPress={() => Alert.alert('Camera Capture', 'Camera capture ready. In web preview, use the browser file uploader to test complete OCR.')}
            >
              <Text style={styles.scanActionBtnText}>Open iPhone Camera</Text>
            </TouchableOpacity>
          </View>
        ) : currentTab === 'warranties' ? (
          <ScrollView style={styles.scroll}>
            <Text style={styles.sectionHeader}>Active Warranties</Text>
            {warranties.map((w) => (
              <View key={w.id} style={styles.historyCard}>
                <Text style={styles.historyComponent}>{w.component}</Text>
                <Text style={styles.historyDesc}>Asset: {w.asset_name}</Text>
                <Text style={styles.historyVendor}>Valid Till: {w.expiry_date} ({w.duration_months} Months)</Text>
                <Text style={styles.historyVendor}>Provider: {w.provider}</Text>
              </View>
            ))}
          </ScrollView>
        ) : (
          <ScrollView style={styles.scroll}>
            <Text style={styles.sectionHeader}>Maintenance Reminders</Text>
            {reminders.map((r) => (
              <View key={r.id} style={styles.historyCard}>
                <Text style={styles.historyComponent}>{r.title}</Text>
                <Text style={styles.historyDesc}>{r.activity}</Text>
                <Text style={styles.historyVendor}>Asset: {r.asset_name} • Due: {r.next_due_date}</Text>
              </View>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Bottom Tabs */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => { setSelectedAsset(null); setCurrentTab('dashboard'); }}
        >
          <Text style={styles.navIcon}>🏠</Text>
          <Text style={[styles.navText, currentTab === 'dashboard' && styles.navTextActive]}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => { setSelectedAsset(null); setCurrentTab('assets'); }}
        >
          <Text style={styles.navIcon}>📦</Text>
          <Text style={[styles.navText, currentTab === 'assets' && styles.navTextActive]}>Assets</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navItem, styles.scanCenterBtn]}
          onPress={() => { setSelectedAsset(null); setCurrentTab('scan'); }}
        >
          <Text style={styles.scanCenterIcon}>📷</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => { setSelectedAsset(null); setCurrentTab('warranties'); }}
        >
          <Text style={styles.navIcon}>🛡️</Text>
          <Text style={[styles.navText, currentTab === 'warranties' && styles.navTextActive]}>Warranties</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => { setSelectedAsset(null); setCurrentTab('reminders'); }}
        >
          <Text style={styles.navIcon}>⏰</Text>
          <Text style={[styles.navText, currentTab === 'reminders' && styles.navTextActive]}>Reminders</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  badgeIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(13, 148, 136, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 18,
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  brandAccent: {
    color: '#14b8a6',
  },
  brandSubtitle: {
    fontSize: 10,
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  scanHeaderBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#0d9488',
  },
  scanHeaderBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  content: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scroll: {
    padding: 16,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  metricVal: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
    marginTop: 4,
  },
  heroBanner: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  heroBadge: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#14b8a6',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  heroTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  heroDesc: {
    fontSize: 12,
    color: '#cbd5e1',
    marginTop: 4,
    lineHeight: 16,
  },
  heroBtn: {
    backgroundColor: '#14b8a6',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  heroBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#334155',
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  assetCard: {
    backgroundColor: '#ffffff',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  regSubtitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0d9488',
    marginTop: 2,
  },
  viewLink: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0d9488',
  },
  backBtn: {
    marginBottom: 12,
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0d9488',
  },
  card: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  assetCategory: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0d9488',
    textTransform: 'uppercase',
  },
  assetTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
    marginTop: 2,
  },
  assetSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  regBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  regBadgeText: {
    fontSize: 12,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    color: '#92400e',
  },
  historyCard: {
    backgroundColor: '#ffffff',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 10,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyDate: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#64748b',
  },
  historyAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  historyComponent: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0d9488',
    marginTop: 4,
  },
  historyDesc: {
    fontSize: 12,
    color: '#334155',
    marginTop: 2,
  },
  historyVendor: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 4,
  },
  warrantyPill: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  warrantyPillText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#065f46',
  },
  scanContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  scanIcon: {
    fontSize: 60,
    marginBottom: 16,
  },
  scanTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
    textAlign: 'center',
  },
  scanDesc: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
  },
  scanActionBtn: {
    backgroundColor: '#0d9488',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 20,
  },
  scanActionBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIcon: {
    fontSize: 18,
  },
  navText: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
  },
  navTextActive: {
    color: '#14b8a6',
    fontWeight: 'bold',
  },
  scanCenterBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0d9488',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  scanCenterIcon: {
    fontSize: 20,
  },
});
