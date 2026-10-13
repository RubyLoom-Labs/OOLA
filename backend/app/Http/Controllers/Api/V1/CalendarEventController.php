<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Calendar\StoreCalendarEventRequest;
use App\Http\Resources\CalendarEventResource;
use App\Models\CalendarEvent;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class CalendarEventController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = CalendarEvent::with(['customer', 'lead', 'project', 'user']);
        if ($request->has('start_date') && $request->has('end_date')) {
            $query->whereBetween('start_time', [$request->start_date, $request->end_date]);
        }

        return CalendarEventResource::collection($query->orderBy('start_time', 'asc')->get());
    }

    public function store(StoreCalendarEventRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['user_id'] = $request->user()->id;

        $event = CalendarEvent::create($data);

        return (new CalendarEventResource($event->load(['customer', 'lead', 'project'])))
            ->response()
            ->setStatusCode(201);
    }

    public function show(CalendarEvent $calendarEvent): CalendarEventResource
    {
        return new CalendarEventResource($calendarEvent->load(['customer', 'lead', 'project', 'user']));
    }

    public function update(Request $request, CalendarEvent $calendarEvent): CalendarEventResource
    {
        $calendarEvent->update($request->all());

        return new CalendarEventResource($calendarEvent->load(['customer', 'lead', 'project']));
    }

    public function destroy(CalendarEvent $calendarEvent): JsonResponse
    {
        $calendarEvent->logicalDelete();

        return response()->json(['message' => 'Event deleted successfully.']);
    }
}
