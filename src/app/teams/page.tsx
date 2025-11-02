import { Users, Mail, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function TeamsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Teams</h1>
        <p className="text-muted-foreground mt-1">
          Collaborate with others on expense tracking
        </p>
      </div>

      {/* Invite Section */}
      <div className="glass-strong rounded-2xl p-6">
        <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-[#00FFFF]" />
          Invite Team Member
        </h2>
        <form className="flex flex-col sm:flex-row gap-3">
          <Input
            type="email"
            placeholder="colleague@example.com"
            className="flex-1 glass border-[rgba(255,255,255,0.15)]"
            aria-label="Email address"
          />
          <Button
            type="submit"
            className="bg-[#00FFFF] text-[#0B0C10] hover:brightness-110"
          >
            <Mail className="w-4 h-4 mr-2" />
            Send Invite
          </Button>
        </form>
      </div>

      {/* Teams List */}
      <div className="glass-strong rounded-2xl p-6">
        <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-[#00FFFF]" />
          Your Teams
        </h2>
        <div className="space-y-3">
          {/* Placeholder - TODO: Fetch from API */}
          <div className="glass rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00FFFF] to-[#A259FF] flex items-center justify-center">
                <Users className="w-5 h-5 text-[#0B0C10]" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Personal</p>
                <p className="text-xs text-muted-foreground">1 member</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="glass border-[rgba(255,255,255,0.2)]"
            >
              Manage
            </Button>
          </div>

          <div className="glass rounded-xl p-8 text-center">
            <p className="text-sm text-muted-foreground">
              No other teams yet. Invite members to get started!
            </p>
          </div>
        </div>
      </div>

      {/* Pending Invites */}
      <div className="glass-strong rounded-2xl p-6">
        <h2 className="text-xl font-semibold text-foreground mb-4">
          Pending Invites
        </h2>
        <div className="glass rounded-xl p-8 text-center">
          <p className="text-sm text-muted-foreground">No pending invites</p>
        </div>
      </div>
    </div>
  );
}
