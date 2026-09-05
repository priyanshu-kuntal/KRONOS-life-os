// ==============================================================================
// KRONOS PHASE 4: AI MISSION CONTROL - BRIEFING CARD COMPONENT
// ==============================================================================

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import {
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Flame,
  Activity as ActivityIcon,
  CheckCircle2,
  Calendar,
  Zap,
} from 'lucide-react-native';
import { useThemeStore } from '../../store/useThemeStore';
import { useAiStore } from '../../store/useAiStore';
import { Card } from './Card';
import { Badge } from './Badge';
import { radii, spacing, typography } from '../../constants/theme';

interface MissionControlBriefingCardProps {
  onOpenChat: () => void;
  onOptimizeSchedule?: () => void;
  style?: any;
}

export const MissionControlBriefingCard: React.FC<MissionControlBriefingCardProps> = ({
  onOpenChat,
  onOptimizeSchedule,
  style,
}) => {
  const { theme } = useThemeStore();
  const { activeBriefing, domainInsights, generateBriefing } = useAiStore();

  useEffect(() => {
    if (!activeBriefing) {
      generateBriefing();
    }
  }, []);

  const briefing = activeBriefing;
  const primaryInsight = domainInsights[0];

  return (
    <Card
      style={[
        styles.container,
        {
          backgroundColor: theme.surface,
          borderColor: theme.borderActive,
        },
        style,
      ]}
      padding="md"
    >
      {/* 1. HEADER */}
      <View style={styles.headerRow}>
        <View style={styles.badgeRow}>
          <View style={[styles.aiDot, { backgroundColor: theme.aiIntelligenceAlpha }]}>
            <Sparkles size={13} color={theme.aiIntelligence} />
          </View>
          <Text style={[styles.badgeText, { color: theme.aiIntelligence }]}>
            MISSION CONTROL BRIEFING
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onOpenChat}
          style={[styles.chatPill, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}
        >
          <Text style={[styles.chatPillText, { color: theme.primary }]}>Ask KRONOS</Text>
          <ArrowRight size={12} color={theme.primary} />
        </TouchableOpacity>
      </View>

      {/* 2. SUMMARY & DIRECTIVE */}
      <Text style={[styles.directiveTitle, { color: theme.textPrimary }]}>
        {briefing ? briefing.greeting : 'Daily Intelligence'}
      </Text>
      <Text style={[styles.summaryText, { color: theme.textSecondary }]}>
        {briefing ? briefing.summary : 'Analyzing active Life OS telemetry...'}
      </Text>

      {/* 3. KEY MISSION METRICS CHIPS */}
      {briefing && (
        <View style={styles.metricsRow}>
          {briefing.priorityTasks.length > 0 && (
            <View style={[styles.metricChip, { backgroundColor: theme.surfaceElevated }]}>
              <CheckCircle2 size={12} color={theme.primary} style={styles.chipIcon} />
              <Text style={[styles.chipText, { color: theme.textPrimary }]}>
                {briefing.priorityTasks.length} Priorities
              </Text>
            </View>
          )}

          {briefing.scheduledEvents.length > 0 && (
            <View style={[styles.metricChip, { backgroundColor: theme.surfaceElevated }]}>
              <Calendar size={12} color={theme.info} style={styles.chipIcon} />
              <Text style={[styles.chipText, { color: theme.textPrimary }]}>
                {briefing.scheduledEvents.length} Events
              </Text>
            </View>
          )}

          {briefing.habitRisks.length > 0 && (
            <View style={[styles.metricChip, { backgroundColor: `${theme.warning}18` }]}>
              <Flame size={12} color={theme.warning} style={styles.chipIcon} />
              <Text style={[styles.chipText, { color: theme.warning }]}>
                {briefing.habitRisks.length} Streak Risk
              </Text>
            </View>
          )}

          {briefing.fitnessPlan && (
            <View style={[styles.metricChip, { backgroundColor: `${theme.fitnessRun}18` }]}>
              <ActivityIcon size={12} color={theme.fitnessRun} style={styles.chipIcon} />
              <Text style={[styles.chipText, { color: theme.fitnessRun }]}>
                {briefing.fitnessPlan.title}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* 4. RECOMMENDED STRATEGY HIGHLIGHT */}
      {briefing && briefing.recommendedStrategy.length > 0 && (
        <View style={[styles.strategyBox, { backgroundColor: theme.surfaceSubtle, borderColor: theme.borderSubtle }]}>
          <View style={styles.strategyTitleRow}>
            <Zap size={12} color={theme.secondary} style={{ marginRight: 6 }} />
            <Text style={[styles.strategyHeader, { color: theme.secondary }]}>
              RECOMMENDED STRATEGY
            </Text>
          </View>
          {briefing.recommendedStrategy.slice(0, 2).map((item, idx) => (
            <Text key={idx} style={[styles.strategyItem, { color: theme.textSecondary }]}>
              • {item}
            </Text>
          ))}
        </View>
      )}

      {/* 5. PROACTIVE INSIGHT / ACTION BANNER */}
      {primaryInsight && (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onOpenChat}
          style={[
            styles.insightBanner,
            {
              backgroundColor: `${theme.aiIntelligence}14`,
              borderColor: `${theme.aiIntelligence}40`,
            },
          ]}
        >
          <View style={styles.insightBannerLeft}>
            <Text style={[styles.insightTitle, { color: theme.textPrimary }]} numberOfLines={1}>
              {primaryInsight.title}
            </Text>
            <Text style={[styles.insightMsg, { color: theme.textSecondary }]} numberOfLines={2}>
              {primaryInsight.actionableRecommendation || primaryInsight.message}
            </Text>
          </View>
          <View style={styles.insightActionArrow}>
            <ArrowRight size={14} color={theme.aiIntelligence} />
          </View>
        </TouchableOpacity>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  badgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: typography.letterSpacing.wider,
  },
  chatPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  chatPillText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },
  directiveTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    marginTop: 4,
  },
  summaryText: {
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    marginTop: 4,
    marginBottom: 10,
  },
  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  metricChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.sm,
  },
  chipIcon: {
    marginRight: 5,
  },
  chipText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
  strategyBox: {
    borderWidth: 1,
    borderRadius: radii.md,
    padding: 10,
    marginBottom: 10,
  },
  strategyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  strategyHeader: {
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: typography.letterSpacing.wider,
  },
  strategyItem: {
    fontSize: typography.fontSize.xs,
    lineHeight: 18,
    marginTop: 2,
  },
  insightBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  insightBannerLeft: {
    flex: 1,
    paddingRight: 8,
  },
  insightTitle: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
  insightMsg: {
    fontSize: typography.fontSize.xs,
    marginTop: 2,
    lineHeight: 16,
  },
  insightActionArrow: {
    paddingLeft: 4,
  },
});
