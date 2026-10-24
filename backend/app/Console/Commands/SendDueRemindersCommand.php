<?php

namespace App\Console\Commands;

use App\Services\ReminderService;
use Illuminate\Console\Command;

class SendDueRemindersCommand extends Command
{
    protected $signature = 'crm:send-reminders';

    protected $description = 'Process due reminders, send in-app notifications and trigger reminder emails';

    public function handle(): int
    {
        $count = ReminderService::processDueReminders();
        $this->info("Processed {$count} due reminder(s).");

        return Command::SUCCESS;
    }
}
