import { useQuery } from '@tanstack/react-query';
import { useUserStore } from '@shared/store/user-store';
import { homeApi } from '@shared/api/endpoints';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card } from '@shared/ui/card';
import { Icons } from '@shared/ui/icons';

export const HomePage = () => {
  const navigate = useNavigate();
  const { user } = useUserStore();

  const { data, isLoading } = useQuery({
    queryKey: ['home', user?.id],
    queryFn: () => homeApi.getData(user!.id),
    enabled: !!user?.id,
  });

  const homeData = data?.data.data;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  const quickActions = [
    { icon: 'Heart' as const, label: 'BP Check', route: '/bp-check', color: 'from-red-500 to-pink-500' },
    { icon: 'Camera' as const, label: 'Food Logger', route: '/food-logger', color: 'from-green-500 to-emerald-500' },
    { icon: 'Pill' as const, label: 'Medications', route: '/medications', color: 'from-purple-500 to-indigo-500' },
    { icon: 'Chart' as const, label: 'Trends', route: '/trends', color: 'from-blue-500 to-cyan-500' },
  ];

  const renderTrendIcon = (trend: string) => {
    if (trend === 'improving') return <Icons.TrendingUp className="w-5 h-5" />;
    if (trend === 'worsening') return <Icons.TrendingDown className="w-5 h-5" />;
    return <Icons.Stable className="w-5 h-5" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-lg text-gray-600">{homeData?.healthPulse}</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* CSS Score Card */}
          {homeData?.css && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-2"
            >
              <Card className="p-8 bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-blue-100 text-sm font-medium mb-1">Cardiovascular Stress Score</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-bold">{homeData.css.score}</span>
                      <span className="text-2xl text-blue-200">/100</span>
                    </div>
                  </div>
                  <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                    <Icons.Heart className="w-10 h-10 text-white" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {renderTrendIcon(homeData.css.trend)}
                  <span className="text-sm font-semibold capitalize">{homeData.css.trend}</span>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Today's Tip */}
          {homeData?.todayTip && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="p-6 bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Icons.LightBulb className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-2">Today's Tip</h3>
                    <p className="text-gray-700 text-sm leading-relaxed">{homeData.todayTip}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action, index) => {
            const IconComponent = Icons[action.icon];
            return (
              <motion.div
                key={action.route}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
              >
                <Card
                  hover
                  onClick={() => navigate(action.route)}
                  className="p-6 text-center cursor-pointer"
                >
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${action.color} flex items-center justify-center shadow-lg`}>
                    <IconComponent className="w-8 h-8 text-white" />
                  </div>
                  <p className="font-semibold text-gray-900">{action.label}</p>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
